/** 还款方式 */
export type RepayType = 'equal-installment' | 'equal-principal' | 'interest-first';

/** 计算模式 */
export type CalcMode = 'reverse' | 'forward';
// reverse：输入月供，反推利率
// forward：输入利率，计算月供

/** 贷款计算输入参数 */
export interface LoanInput {
  principal: number;        // 贷款本金
  months: number;           // 总期数
  monthlyPayment: number;   // 月还款额 / 首月还款 / 每月利息
  repayType: RepayType;     // 还款方式
  mode: CalcMode;           // 计算模式
  annualRate?: number;      // 正向模式：年利率（%，如 9.84 表示 9.84%）
  contractRate?: number;    // 合同约定年利率（可选，用于对比）
  upfrontFee?: number;      // 一次性前置费用
}

/** 计算结果 */
export interface CalcResult {
  monthlyRate: number;       // 月利率
  annualNominalRate: number; // 名义年利率
  annualAPR: number;         // 实际年化利率 (APR)
  totalPayment: number;      // 总还款额
  totalInterest: number;     // 总利息
  totalFee: number;          // 总费用（利息+前置费）
  schedule: RepayItem[];     // 还款明细表
  isOvercharged: boolean | null; // 是否多收费（null=未提供合同利率）
  overchargeAmount: number;  // 多收金额
  mode: CalcMode;            // 计算模式
  repayType: RepayType;      // 还款方式
}

/** 每期还款明细 */
export interface RepayItem {
  period: number;        // 期数
  principal: number;     // 本金
  interest: number;      // 利息
  p