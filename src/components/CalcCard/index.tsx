import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import { RepayType, CalcMode, CashFlow } from '@/types/loan';
import { parseCashFlows, fmtMoney } from '@/utils/calc';
import styles from './index.module.scss';

interface CalcCardProps {
  onSubmit: (data: {
    principal: number;
    months: number;
    monthlyPayment: number;
    repayType: RepayType;
    mode: CalcMode;
    annualRate: number | undefined;
    contractRate: number | undefined;
    upfrontFee: number;
    flows?: CashFlow[];
    startDate?: string;
  }) => void;
}

const REPAY_OPTIONS: { key: RepayType; label: string }[] = [
  { key: 'equal-installment', label: '等额本息' },
  { key: 'equal-principal', label: '等额本金' },
  { key: 'interest-first', label: '先息后本' },
];

const MODE_OPTIONS: { key: CalcMode; label: string }[] = [
  { key: 'reverse', label: '反推利率' },
  { key: 'forward', label: '正向计算' },
  { key: 'flow', label: '流水分析' },
];

const CalcCard: React.FC<CalcCardProps> = ({ onSubmit }) => {
  const [mode, setMode] = useState<CalcMode>('reverse');
  const [repayType, setRepayType] = useState<RepayType>('equal-installment');

  const [principal, setPrincipal] = useState('');
  const [months, setMonths] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [contractRate, setContractRate] = useState('');
  const [upfrontFee, setUpfrontFee] = useState('');

  // 流水模式字段
  const [flowText, setFlowText] = useState('');
  const [startDate, setStartDate] = useState('');

  // 实时解析流水
  const flowParse = useMemo(() => {
    if (mode !== 'flow' || !flowText.trim()) return null;
    return parseCashFlows(flowText);
  }, [flowText, mode]);

  const handleSubmit = () => {
    const p = parseFloat(principal);
    if (!p) return;

    if (mode === 'flow') {
      const parsed = parseCashFlows(flowText);
      if (parsed.flows.length === 0) return;
      onSubmit({
        principal: p,
        months: parsed.flows.length,
        monthlyPayment: 0,
        repayType: 'equal-installment',
        mode: 'flow',
        annualRate: undefined,
        contractRate: contractRate ? parseFloat(contractRate) : undefined,
        upfrontFee: upfrontFee ? parseFloat(upfrontFee) : 0,
        flows: parsed.flows,
        startDate: startDate || undefined,
      });
      return;
    }

    const m = parseInt(months, 10);
    if (!m) return;

    if (mode === 'reverse') {
      const a = parseFloat(monthlyPayment);
      if (!a) return;
      onSubmit({
        principal: p, months: m, monthlyPayment: a,
        repayType, mode,
        annualRate: undefined,
        contractRate: contractRate ? parseFloat(contractRate) : undefined,
        upfrontFee: upfrontFee ? parseFloat(upfrontFee) : 0,
      });
    } else {
      const r = parseFloat(annualRate);
      if (!r) return;
      onSubmit({
        principal: p, months: m, monthlyPayment: 0,
        repayType, mode,
        annualRate: r,
        contractRate: contractRate ? parseFloat(contractRate) : undefined,
        upfrontFee: upfrontFee ? parseFloat(upfrontFee) : 0,
      });
    }
  };

  const isFlow = mode === 'flow';
  const isReverse = mode === 'reverse';
  let isValid = false;
  if (isFlow) {
    isValid = !!principal && flowParse !== null && flowParse.flows.length > 0 && flowParse.errors.length === 0;
  } else {
    isValid = !!principal && !!months && (isReverse ? !!monthlyPayment : !!annualRate);
  }

  return (
    <View className={styles.card}>
      {/* 头部 */}
      <View className={styles.cardHeader}>
        <View className={styles.headerAccent} />
        <Text className={styles.title}>贷款参数</Text>
      </View>

      {/* 模式切换 — 三选一 */}
      <View className={styles.segRow}>
        {MODE_OPTIONS.map(opt => (
          <View
            key={opt.key}
            className={[styles.segItem, mode === opt.key ? styles.segActive : ''].join(' ')}
            onClick={() => setMode(opt.key)}
          >
            <Text className={mode === opt.key ? styles.segTextActive : styles.segText}>{opt.label}</Text>
          </View>
        ))}
      </View>

      {/* 还款方式（非流水模式才显示） */}
      {!isFlow && (
        <View className={styles.segRow}>
          {REPAY_OPTIONS.map(opt => (
            <View
              key={opt.key}
              className={[styles.segItem, repayType === opt.key ? styles.segActive : ''].join(' ')}
              onClick={() => setRepayType(opt.key)}
            >
              <Text className={repayType === opt.key ? styles.segTextActive : styles.segText}>{opt.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 本金 */}
      <View className={styles.field}>
        <Text className={styles.label}>贷款本金（元）</Text>
        <View className={styles.inputWrap}>
          <Text className={styles.inputIcon}>¥</Text>
          <Input
            className={styles.input}
            type="digit"
            placeholder="如 150000"
            value={principal}
            onInput={e => setPrincipal(e.detail.value)}
          />
        </View>
      </View>

      {/* ===== 流水模式专属区域 ===== */}
      {isFlow ? (
        <>
          {/* 放款日期 */}
          <View className={styles.field}>
            <Text className={styles.label}>放款日期（选填）</Text>
            <View className={styles.inputWrap}>
              <Text className={styles.inputIcon}>D</Text>
              <Input
                className={styles.input}
                type="text"
                placeholder="如 2017-12-15"
                value={startDate}
                onInput={e => setStartDate(e.detail.value)}
              />
            </View>
          </View>

          {/* 流水粘贴区 */}
          <View className={styles.field}>
            <Text className={styles.label}>
              还款流水
              <Text className={styles.labelHint}> — 每行一笔还款</Text>
            </Text>
            <Textarea
              className={styles.flowTextarea}
              placeholder={'粘贴还款记录，支持格式：\n2020-01-15 5389.81\n2020/02/15, 5389.81\n1月15日 ¥5,389.81\n5389.81（无日期则按月排序）'}
              value={flowText}
              onInput={e => setFlowText(e.detail.value)}
              autoHeight
              maxlength={10000}
            />
          </View>

          {/* 解析预览 */}
          {flowParse && flowParse.flows.length > 0 && (
            <View className={styles.flowPreview}>
              <View className={styles.flowPreviewHeader}>
                <Text className={styles.flowPreviewTitle}>
                  已识别 {flowParse.flows.length} 笔还款
                </Text>
                <Text className={styles.flowPreviewTotal}>
                  合计 ¥{fmtMoney(flowParse.flows.reduce((s, f) => s + f.amount, 0))}
                </Text>
              </View>
              <View className={styles.flowPreviewList}>
                {flowParse.flows.slice(0, 5).map((f, i) => (
                  <View key={i} className={styles.flowPreviewItem}>
                    <Text className={styles.flowPreviewDate}>
                      {f.date || `第${i + 1}期`}
                    </Text>
                    <Text className={styles.flowPreviewAmt}>¥{fmtMoney(f.amount)}</Text>
                  </View>
                ))}
                {flowParse.flows.length > 5 && (
                  <Text className={styles.flowPreviewMore}>
                    ...共 {flowParse.flows.length} 笔
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* 解析错误 */}
          {flowParse && flowParse.errors.length > 0 && (
            <View className={styles.flowErrors}>
              {flowParse.errors.map((err, i) => (
                <Text key={i} className={styles.flowErrorItem}>{err}</Text>
              ))}
            </View>
          )}

          {/* 合同利率 */}
          <View className={styles.field}>
            <Text className={styles.label}>合同年利率 %（选填）</Text>
            <View className={styles.inputWrap}>
              <Text className={styles.inputIcon}>%</Text>
              <Input
                className={styles.input}
                type="digit"
                placeholder="如 9.84"
                value={contractRate}
                onInput={e => setContractRate(e.detail.value)}
              />
            </View>
          </View>

          {/* 提示 */}
          <View className={styles.flowTip}>
            <Text className={styles.flowTipText}>
              支持银行流水、支付宝、微信账单等直接粘贴。每行包含金额即可，日期非必填。
            </Text>
          </View>
        </>
      ) : (
        <>
          {/* 期数 + 动态字段 */}
          <View className={styles.row}>
            <View className={styles.halfField}>
              <Text className={styles.label}>总期数（月）</Text>
              <View className={styles.inputWrap}>
                <Text className={styles.inputIcon}>N</Text>
                <Input
                  className={styles.input}
                  type="number"
                  placeholder="如 36"
                  value={months}
                  onInput={e => setMonths(e.detail.value)}
                />
              </View>
            </View>
            <View className={styles.halfField}>
              <Text className={styles.label}>
                {isReverse
                  ? repayType === 'interest-first' ? '每月付息（元）' : repayType === 'equal-principal' ? '首月还款（元）' : '月还款额（元）'
                  : '年利率（%）'}
              </Text>
              <View className={styles.inputWrap}>
                <Text className={styles.inputIcon}>{isReverse ? '¥' : '%'}</Text>
                <Input
                  className={styles.input}
                  type="digit"
                  placeholder={isReverse
                    ? repayType === 'interest-first' ? '如 2194.50' : '如 5389.81'
                    : '如 9.84'}
                  value={isReverse ? monthlyPayment : annualRate}
                  onInput={e => isReverse ? setMonthlyPayment(e.detail.value) : setAnnualRate(e.detail.value)}
                />
              </View>
            </View>
          </View>

          {/* 合同利率 + 前置费 */}
          <View className={styles.row}>
            <View className={styles.halfField}>
              <Text className={styles.label}>合同年利率（选填）</Text>
              <View className={styles.inputWrap}>
                <Text className={styles.inputIcon}>%</Text>
                <Input
                  className={styles.input}
                  type="digit"
                  placeholder="如 9.84"
                  value={contractRate}
                  onInput={e => setContractRate(e.detail.value)}
                />
              </View>
            </View>
            <View className={styles.halfField}>
              <Text className={styles.label}>前置费用（选填）</Text>
              <View className={styles.inputWrap}>
                <Text className={styles.inputIcon}>+</Text>
                <Input
                  className={styles.input}
                  type="digit"
                  placeholder="如 20"
                  value={upfrontFee}
                  onInput={e => setUpfrontFee(e.detail.value)}
                />
              </View>
            </View>
          </View>
        </>
      )}

      {/* 按钮 */}
      <View
        className={[styles.button, isValid ? styles.buttonActive : styles.buttonDisabled].join(' ')}
        onClick={isValid ? handleSubmit : undefined}
      >
        <Text className={styles.buttonText}>
          {isFlow ? '分析流水' : isReverse ? '开始核算' : '计算月供'}
        </Text>
        {isValid && <View className={styles.buttonGlow} />}
      </View>
    </View>
  );
};

export default CalcCard;
