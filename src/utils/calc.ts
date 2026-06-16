import { LoanInput, CalcResult, RepayItem, RepayType, CashFlow } from '@/types/loan';

// ──────────────────────────────────────────────
// 基础工具
// ──────────────────────────────────────────────

const ROUND = (v: number) => Math.round(v * 100) / 100;

/** 等额本息月供公式：P * r * (1+r)^n / ((1+r)^n - 1) */
function eqInstPmt(P: number, n: number, r: number): number {
  return P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

/** 二分法反推月利率（等额本息） */
function bisectRate(P: number, n: number, A: number): number {
  if (A * n <= P) return 0;
  let lo = 0.00001;
  let hi = 0.05;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (eqInstPmt(P, n, mid) > A) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

// ──────────────────────────────────────────────
// 还款明细生成
// ──────────────────────────────────────────────

/** 等额本息 */
function genEqualInstallment(P: number, n: number, r: number, A: number): RepayItem[] {
  const items: RepayItem[] = [];
  let remaining = P;
  for (let i = 1; i <= n; i++) {
    const interest = ROUND(remaining * r);
    const principal = ROUND(A - interest);
    remaining = ROUND(remaining - principal);
    items.push({ period: i, principal, interest, payment: A, remaining: Math.max(0, remaining) });
  }
  return items;
}

/** 等额本金 */
function genEqualPrincipal(P: number, n: number, r: number): RepayItem[] {
  const items: RepayItem[] = [];
  const mp = ROUND(P / n);
  let remaining = P;
  for (let i = 1; i <= n; i++) {
    const interest = ROUND(remaining * r);
    const payment = ROUND(mp + interest);
    remaining = ROUND(remaining - mp);
    items.push({ period: i, principal: mp, interest, payment, remaining: Math.max(0, remaining) });
  }
  return items;
}

/** 先息后本 */
function genInterestFirst(P: number, n: number, r: number): RepayItem[] {
  const items: RepayItem[] = [];
  const interestOnly = ROUND(P * r);
  let remaining = P;
  for (let i = 1; i <= n; i++) {
    if (i < n) {
      items.push({ period: i, principal: 0, interest: interestOnly, payment: interestOnly, remaining });
    } else {
      const lastInterest = ROUND(remaining * r);
      const lastPayment = ROUND(remaining + lastInterest);
      items.push({ period: i, principal: remaining, interest: lastInterest, payment: lastPayment, remaining: 0 });
    }
  }
  return items;
}

// ──────────────────────────────────────────────
// 反向计算：由月供反推利率
// ──────────────────────────────────────────────

function reverseCalc(input: LoanInput): { monthlyRate: number; schedule: RepayItem[]; monthlyPayment: number } {
  const { principal, months, monthlyPayment, repayType } = input;
  let r: number;
  let schedule: RepayItem[];
  let A: number;

  if (repayType === 'equal-installment') {
    r = bisectRate(principal, months, monthlyPayment);
    A = monthlyPayment;
    schedule = genEqualInstallment(principal, months, r, A);
  } else if (repayType === 'equal-principal') {
    r = (monthlyPayment - principal / months) / principal;
    schedule = genEqualPrincipal(principal, months, r);
    A = schedule[0].payment;
  } else {
    // interest-first: 月供 = P * r
    r = monthlyPayment / principal;
    schedule = genInterestFirst(principal, months, r);
    A = schedule[0].payment;
  }
  return { monthlyRate: r, schedule, monthlyPayment: A };
}

// ──────────────────────────────────────────────
// 正向计算：由利率计算月供
// ──────────────────────────────────────────────

function forwardCalc(input: LoanInput): { monthlyRate: number; schedule: RepayItem[]; monthlyPayment: number } {
  const { principal, months, repayType, annualRate = 0 } = input;
  const r = annualRate / 100 / 12;
  let schedule: RepayItem[];
  let A: number;

  if (repayType === 'equal-installment') {
    A = ROUND(eqInstPmt(principal, months, r));
    schedule = genEqualInstallment(principal, months, r, A);
  } else if (repayType === 'equal-principal') {
    schedule = genEqualPrincipal(principal, months, r);
    A = schedule[0].payment;
  } else {
    // interest-first: 每月只还利息
    schedule = genInterestFirst(principal, months, r);
    A = ROUND(principal * r);
  }
  return { monthlyRate: r, schedule, monthlyPayment: A };
}

// ──────────────────────────────────────────────
// 入口
// ──────────────────────────────────────────────

export function calculate(input: LoanInput): CalcResult {
  const { principal, months, repayType, mode, contractRate, upfrontFee = 0, flows, startDate } = input;

  // 流水模式：XIRR 分析
  if (mode === 'flow' && flows && flows.length > 0) {
    return flowCalc(principal, flows, startDate, contractRate, upfrontFee);
  }

  const { monthlyRate, schedule, monthlyPayment } =
    mode === 'forward' ? forwardCalc(input) : reverseCalc(input);

  const annualNominalRate = monthlyRate * 12;
  const annualAPR = Math.pow(1 + monthlyRate, 12) - 1;
  const totalPayment = schedule.reduce((s, r) => s + r.payment, 0);
  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  const totalFee = totalInterest + upfrontFee;

  // 多收费判定
  let isOvercharged: boolean | null = null;
  let overchargeAmount = 0;

  if (mode === 'reverse' && contractRate !== undefined && contractRate > 0) {
    const contractMonthly = contractRate / 100 / 12;
    const expectedInterest = _expectedInterest(principal, months, contractMonthly, repayType, schedule);
    overchargeAmount = ROUND(totalInterest - expectedInterest);
    isOvercharged = overchargeAmount > 0.5;
  }

  if (mode === 'forward' && contractRate !== undefined && contractRate > 0) {
    // 正向模式：输入的利率就是实际利率，直接比较合同利率
    const contractMonthly = contractRate / 100 / 12;
    const contractApr = Math.pow(1 + contractMonthly, 12) - 1;
    const actualApr = Math.pow(1 + monthlyRate, 12) - 1;
    isOvercharged = actualApr > contractApr + 0.001;
    if (isOvercharged) {
      const expectedInterest = _expectedInterest(principal, months, contractMonthly, repayType, schedule);
      overchargeAmount = ROUND(totalInterest - expectedInterest);
    }
  }

  return {
    monthlyRate,
    annualNominalRate,
    annualAPR,
    totalPayment,
    totalInterest,
    totalFee,
    schedule,
    isOvercharged,
    overchargeAmount,
    mode,
    repayType,
  };
}

/** 按合同利率推算应收利息 */
function _expectedInterest(P: number, n: number, r: number, type: RepayType, refSchedule: RepayItem[]): number {
  if (type === 'equal-installment') {
    const A = ROUND(eqInstPmt(P, n, r));
    return genEqualInstallment(P, n, r, A).reduce((s, item) => s + item.interest, 0);
  } else if (type === 'equal-principal') {
    return genEqualPrincipal(P, n, r).reduce((s, item) => s + item.interest, 0);
  } else {
    return genInterestFirst(P, n, r).reduce((s, item) => s + item.interest, 0);
  }
}

// ──────────────────────────────────────────────
// 格式化
// ──────────────────────────────────────────────

export function fmtPct(v: number, decimals = 2): string {
  return (v * 100).toFixed(decimals) + '%';
}

export function fmtMoney(v: number): string {
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 还款方式中文名 */
export function repayTypeLabel(t: RepayType): string {
  return { 'equal-installment': '等额本息', 'equal-principal': '等额本金', 'interest-first': '先息后本' }[t];
}

// ──────────────────────────────────────────────
// 流水分析：XIRR + 文本解析
// ──────────────────────────────────────────────

/** 解析用户粘贴的还款流水文本 → CashFlow[] */
export function parseCashFlows(text: string): { flows: CashFlow[]; errors: string[] } {
  const flows: CashFlow[] = [];
  const errors: string[] = [];
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 跳过纯注释行
    if (/^(日期|金额|备注|date|amount|#|\/\/)/i.test(line)) continue;

    // 尝试分离日期和金额
    const parts = line
      .replace(/[,，\t\s|]+/g, '|')
      .split('|')
      .map(s => s.trim())
      .filter(Boolean);

    if (parts.length === 0) continue;

    let date: string | undefined;
    let amount: number | undefined;
    let label: string | undefined;

    for (const part of parts) {
      // 匹配日期: 2020-01-15, 2020/01/15, 2020.01.15, 01-15, 1月15日
      const dateMatch = part.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$|^(\d{1,2})[-\/](\d{1,2})$|^(\d{1,2})月(\d{1,2})[日号]$/);
      if (dateMatch && !amount) {
        if (dateMatch[1]) {
          date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
        } else if (dateMatch[4]) {
          // 只有月-日，补年份
          const y = new Date().getFullYear();
          date = `${y}-${dateMatch[4].padStart(2, '0')}-${dateMatch[5].padStart(2, '0')}`;
        } else if (dateMatch[6]) {
          const y = new Date().getFullYear();
          date = `${y}-${dateMatch[6].padStart(2, '0')}-${dateMatch[7].padStart(2, '0')}`;
        }
        continue;
      }
      // 匹配金额: 5389.81, ¥5,389.81, 5389, -5000
      const amtMatch = part.replace(/[¥￥$,，\s]/g, '').match(/^-?\d+\.?\d*$/);
      if (amtMatch && amount === undefined) {
        amount = parseFloat(amtMatch[0]);
        continue;
      }
      // 剩下的作为标签
      if (amtMatch && amount !== undefined) {
        label = part;
      }
    }

    if (amount === undefined) {
      errors.push(`第${i + 1}行未能识别金额: "${line}"`);
      continue;
    }

    // 负值转正（还款通常记为负或正，统一存正数）
    flows.push({ date, amount: Math.abs(amount), label });
  }

  return { flows, errors };
}

/** XIRR 计算：二分法求不规则现金流的年化 IRR */
export function calcXIRR(principal: number, flows: CashFlow[]): number {
  if (flows.length === 0) return 0;

  // 构建净现值函数：NPV(r) = -principal + Σ(flow_i / (1+r)^t_i)
  // 其中 t_i 以年为单位（365天）
  const tValues = flows.map(f => {
    if (f.date) {
      const d = new Date(f.date);
      // 用第一条有日期的记录作为基准
      return d.getTime();
    }
    return 0;
  });

  // 找到第一条有日期的记录
  const baseMs = tValues.find(t => t !== 0);
  if (baseMs) {
    for (let i = 0; i < tValues.length; i++) {
      if (tValues[i] === 0) {
        // 没有日期的记录：按月序计算，从 baseDate 往后推
        const firstDateIdx = tValues.findIndex(t => t > 0);
        const monthOffset = i - firstDateIdx;
        const baseDate = new Date(baseMs!);
        baseDate.setMonth(baseDate.getMonth() + monthOffset);
        tValues[i] = baseDate.getTime();
      }
    }
  } else {
    // 完全没有日期：按月序 30 天间隔
    const now = Date.now();
    for (let i = 0; i < tValues.length; i++) {
      tValues[i] = now + i * 30 * 86400000;
    }
    baseMs && (tValues[0] = baseMs); // unreachable but keep type happy
  }

  const firstMs = Math.min(...tValues);
  const yearFracs = tValues.map(t => (t - firstMs) / (365 * 86400000));

  function npv(r: number): number {
    let sum = -principal;
    for (let i = 0; i < flows.length; i++) {
      sum += flows[i].amount / Math.pow(1 + r, yearFracs[i]);
    }
    return sum;
  }

  // 二分法
  let lo = 0.0001;
  let hi = 2.0;
  const npvLo = npv(lo);
  const npvHi = npv(hi);

  if (npvLo <= 0) return 0;  // 还款总额 ≤ 本金，无利率
  if (npvHi >= 0) return hi; // 极高利率

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const npvMid = npv(mid);
    if (Math.abs(npvMid) < 0.01) return mid;
    if (npvMid > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 流水模式完整计算 */
function flowCalc(
  principal: number,
  flows: CashFlow[],
  startDate: string | undefined,
  contractRate: number | undefined,
  upfrontFee: number,
): CalcResult {
  const annualAPR = calcXIRR(principal, flows);
  const monthlyRate = Math.pow(1 + annualAPR, 1 / 12) - 1;
  const annualNominalRate = monthlyRate * 12;
  const totalPayment = flows.reduce((s, f) => s + f.amount, 0);
  const totalInterest = totalPayment - principal;
  const totalFee = totalInterest + upfrontFee;

  // 构建 schedule
  const schedule: RepayItem[] = flows.map((f, i) => ({
    period: i + 1,
    principal: 0,
    interest: 0,
    payment: f.amount,
    remaining: principal - flows.slice(0, i + 1).reduce((s, x) => s + x.amount, 0),
  }));

  // 多收费判定
  let isOvercharged: boolean | null = null;
  let overchargeAmount = 0;
  if (contractRate !== undefined && contractRate > 0) {
    const contractApr = contractRate / 100;
    isOvercharged = annualAPR > contractApr + 0.001;
    if (isOvercharged) {
      overchargeAmount = ROUND(totalInterest - principal * contractApr * (flows.length / 12));
    }
  }

  return {
    monthlyRate,
    annualNominalRate,
    annualAPR,
    totalPayment,
    totalInterest,
    totalFee,
    schedule,
    isOvercharged,
    overchargeAmount,
    mode: 'flow',
    repayType: 'equal-installment',
    parsedFlows: flows,
  };
}
