"""
浦发万用金账单提取与分析脚本
从 PDF 账单中提取万用金相关信息，计算实际利率
"""
import pdfplumber
import glob
import re
import json
from collections import defaultdict
from pathlib import Path

PDF_DIR = Path(r"d:\GitHubStore\calculateinterest\pdf")

def extract_bill_month(filename):
    """从文件名提取年月，如 '201712账单.pdf' -> '201712'"""
    m = re.search(r'(\d{6})账单', filename)
    return m.group(1) if m else None

def parse_amount(text):
    """从文本中提取金额"""
    text = text.replace(',', '').replace(' ', '')
    m = re.search(r'￥([\-\d,]+\.?\d*)', text)
    if m:
        return float(m.group(1))
    return None

def classify_entry(line):
    """分类条目：放款、手续费、转分期、利息、本金"""
    if '转账手续费' in line:
        return 'fee'
    if '转分期付款' in line:
        return 'transfer'
    if re.search(r'(万用金|现金分期)\s+\d{4}\s+￥', line):
        return 'disburse'  # 放款
    if re.search(r'(利息|息费)', line):
        return 'interest'
    if re.search(r'(分摊本金|每月分摊本金)', line):
        return 'principal'
    return 'unknown'

def parse_period(text):
    """提取期数信息"""
    m = re.search(r'第(\d+)期共(\d+)期', text)
    if m:
        return int(m.group(1)), int(m.group(2))
    return None, None

def extract_from_pdf(pdf_path):
    """从单个 PDF 所有页面提取万用金条目"""
    results = []
    bill_month = extract_bill_month(str(pdf_path))
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue
            
            for line in text.split('\n'):
                if '万用金' not in line and '现金分期' not in line:
                    continue
                
                amount = parse_amount(line)
                period, total_periods = parse_period(line)
                category = classify_entry(line)
                
                # 只保留利息和本金分期条目 + 手续费
                if category not in ('interest', 'principal', 'fee', 'disburse'):
                    continue
                
                entry = {
                    'bill_month': bill_month,
                    'category': category,
                    'raw_line': line.strip(),
                    'amount': amount,
                    'period': period,
                    'total_periods': total_periods,
                    'page': page_num + 1,
                }
                results.append(entry)
    
    return results

def main():
    pdf_files = sorted(glob.glob(str(PDF_DIR / "**" / "*.pdf"), recursive=True))
    print(f"找到 {len(pdf_files)} 个 PDF 文件\n")
    
    all_entries = []
    for pdf_file in pdf_files:
        entries = extract_from_pdf(pdf_file)
        all_entries.extend(entries)
    
    # 分类汇总
    disburse_entries = [e for e in all_entries if e['category'] == 'disburse']
    fee_entries = [e for e in all_entries if e['category'] == 'fee']
    interest_entries = [e for e in all_entries if e['category'] == 'interest']
    principal_entries = [e for e in all_entries if e['category'] == 'principal']
    
    interest_entries.sort(key=lambda x: x['period'] or 0)
    principal_entries.sort(key=lambda x: x['period'] or 0)
    
    print("=" * 80)
    print("万用金放款 & 费用")
    print("=" * 80)
    for e in disburse_entries + fee_entries:
        print(f"  {e['bill_month']}  {e['raw_line'][:60]:60s}  ￥{e['amount']:>10.2f}")
    
    print("\n" + "=" * 80)
    print("万用金分期还款明细（等额本息，每月还款额固定）")
    print("=" * 80)
    print(f"{'期数':>4s}  {'账单月':>8s}  {'本金':>12s}  {'利息':>12s}  {'月还款':>12s}  {'剩余本金':>12s}")
    print("-" * 75)
    
    # 合并利息和本金记录
    period_data = {}
    for e in interest_entries:
        p = e['period']
        if p not in period_data:
            period_data[p] = {}
        period_data[p]['interest'] = e['amount']
        period_data[p]['bill_month'] = e['bill_month']
    
    for e in principal_entries:
        p = e['period']
        if p not in period_data:
            period_data[p] = {}
        period_data[p]['principal'] = e['amount']
        period_data[p]['bill_month'] = e['bill_month']
    
    loan_principal = 150000.0
    remaining = loan_principal
    total_interest_paid = 0
    total_principal_paid = 0
    
    for period in sorted(period_data.keys()):
        data = period_data[period]
        principal = data.get('principal', 0)
        interest = data.get('interest', 0)
        monthly = principal + interest
        remaining -= principal
        total_interest_paid += interest
        total_principal_paid += principal
        
        print(f"  {period:3d}  {data.get('bill_month', '?'):>8s}  "
              f"￥{principal:>9,.2f}  ￥{interest:>9,.2f}  "
              f"￥{monthly:>9,.2f}  ￥{remaining:>9,.2f}")
    
    print("-" * 75)
    # 补全未提取到的剩余期数
    extracted_periods = len(period_data)
    
    print(f"\n已提取 {extracted_periods} / {interest_entries[0].get('total_periods', '?') if interest_entries else '?'} 期")
    
    # 汇总
    print("\n" + "=" * 80)
    print("费用汇总")
    print("=" * 80)
    
    disbursement = sum(e['amount'] for e in disburse_entries)
    fee = sum(e['amount'] for e in fee_entries)
    
    print(f"  万用金放款金额:             ￥{disbursement:>12,.2f}")
    print(f"  转账手续费:                 ￥{fee:>12,.2f}")
    print(f"  已提取本金合计:             ￥{total_principal_paid:>12,.2f}")
    print(f"  已提取利息合计:             ￥{total_interest_paid:>12,.2f}")
    print(f"  已提取本息合计:             ￥{total_principal_paid + total_interest_paid:>12,.2f}")
    
    if extracted_periods == 36:
        monthly_amount = (total_principal_paid + total_interest_paid) / 36
        print(f"\n  每月固定还款:               ￥{monthly_amount:>12,.2f}")
        print(f"  36期还款总额:               ￥{total_principal_paid + total_interest_paid:>12,.2f}")
        print(f"  总费用(利息+手续费):        ￥{total_interest_paid + fee:>12,.2f}")
        
        # 计算 IRR
        print("\n" + "=" * 80)
        print("IRR 计算（等额本息）")
        print("=" * 80)
        # 现金流：第0期放款 +150000（实际到账 150000 - 20 = 149980）
        # 第1~36期每期还款 -5389.81（固定）
        net_disburse = disbursement - fee
        monthly = monthly_amount
        
        # 使用 numpy 计算 IRR（如果有的话）
        try:
            import numpy as np
            import numpy_financial as npf
            cashflows = [net_disburse] + [-monthly] * 36
            monthly_rate = npf.irr(cashflows)
            annual_rate = (1 + monthly_rate) ** 12 - 1
            nominal_annual = monthly_rate * 12
            print(f"  实际到账金额:               ￥{net_disburse:>12,.2f}")
            print(f"  每月还款:                   ￥{monthly:>12,.2f}")
            print(f"  月利率 (IRR):               {monthly_rate*100:.4f}%")
            print(f"  名义年利率:                 {nominal_annual*100:.2f}%")
            print(f"  实际年化利率 (APR):         {annual_rate*100:.2f}%")
        except ImportError:
            # 使用 approximate 方法
            print(f"  (需要 numpy_financial 计算精确 IRR，使用近似估算)")
            # 近似：总利息 / 本金 / 年数 / 平均本金占用比例
            total_cost = total_interest_paid + fee
            avg_years = 1.5  # 36个月平均占用时间
            approx_rate = total_cost / net_disburse / avg_years
            print(f"  近似年利率:                 {approx_rate*100:.2f}%")

    # 保存为 JSON
    output = {
        'disbursement': disbursement,
        'fee': fee,
        'total_interest': total_interest_paid,
        'total_principal': total_principal_paid,
        'period_data': {str(k): v for k, v in period_data.items()},
        'all_entries': all_entries,
    }
    
    with open('extracted_data.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n数据已保存到 extracted_data.json")

if __name__ == '__main__':
    main()
