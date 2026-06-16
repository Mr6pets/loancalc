import { BillEntry } from '@/types/loan';

/** 浦发万用金示例账单数据（从实际 PDF 提取的部分数据，仅供演示） */
export const demoBills: BillEntry[] = [
  { month: '201712', period: 1, principal: 3194.81, interest: 2195.00, category: '万用金' },
  { month: '201801', period: 2, principal: 3241.56, interest: 2148.25, category: '万用金' },
  { month: '201802', period: 3, principal: 3288.99, interest: 2100.82, category: '万用金' },
  { month: '201803', period: 4, principal: 3337.12, interest: 2052.69, category: '万用金' },
  { month: '201804', period: 5, principal: 3385.96, interest: 2003.85, category: '万用金' },
  { month: '201805', period: 6, principal: 3435.50, interest: 1954.31, category: '万用金' },
  { month: '201806', period: 7, principal: 3485.78, interest: 1904.03, category: '现金分期' },
  { month: '201807', period: 8, principal: 3536.78, interest: 1853.03, category: '现金分期' },
  { month: '201808', period: 9, principal: 3588.54, interest: 1801.27, category: '现金分期' },
  { month: '201809', period: 10, principal: 3641.05, interest: 1748.76, category: '现金分期' },
];

export const demoSummary = {
  principal: 150000,
  months: 36,
  monthlyPayment: 5389.81,
  totalInterest: 44033.16,
  monthlyRate: 0.014633,
  apr: 0.1904,
};
