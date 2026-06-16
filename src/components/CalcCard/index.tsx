import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import { RepayType, CalcMode } from '@/types/loan';
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
  }) => void;
}

const REPAY_OPTIONS: { key: RepayType; label: string }[] = [
  { key: 'equal-installment', label: '等额本息' },
  { key: 'equal-principal', label: '等额本金' },
  { key: 'interest-first', label: '先息后本' },
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

  const handleSubmit = () => {
    const p = parseFloat(principal);
    const m = parseInt(months, 10);
    if (!p || !m) return;

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

  const isReverse = mode === 'reverse';
  const isValid = principal && months && (isReverse ? monthlyPayment : annualRate);

  return (
    <View className={styles.card}>
      {/* 头部 */}
      <View className={styles.cardHeader}>
        <View className={styles.headerAccent} />
        <Text className={styles.title}>贷款参数</Text>
      </View>

      {/* 模式切换 */}
      <View className={styles.segRow}>
        <View
          className={[styles.segItem, mode === 'reverse' ? styles.segActive : ''].join(' ')}
          onClick={() => setMode('reverse')}
        >
          <Text className={mode === 'reverse' ? styles.segTextActive : styles.segText}>反推利率</Text>
        </View>
        <View
          className={[styles.segItem, mode === 'forward' ? styles.segActive : ''].join(' ')}
          onClick={() => setMode('forward')}
        >
          <Text className={mode === 'forward' ? styles.segTextActive : styles.segText}>正向计算</Text>
        </View>
      </View>

      {/* 还款方式 */}
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

      {/* 期数 + 动态字段 */}
      <View className={styles.row}>
        <View className={styles.halfField}>
          <Text className={styles.label}>总期数（月�