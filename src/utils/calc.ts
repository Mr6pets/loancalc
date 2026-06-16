import { LoanInput, CalcResult, RepayItem, RepayType } from '@/types/loan';

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
// ────────────────────────────────────────────�