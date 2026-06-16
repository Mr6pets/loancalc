import React from 'react';
import { View, Text } from '@tarojs/components';
import { CalcResult } from '@/types/loan';
import { fmtPct, fmtMoney, repayTypeLabel } from '@/utils/calc';
import styles from './index.module.scss';

interface ResultCardProps {
  result: CalcResult;
  onViewDetail?: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onViewDetail }) => {
  const { annualAPR, totalInterest, totalFee, totalPayment, isOvercharged, overchargeAmount, mode, repayType, schedule } = result;
  const rateHigh = annualAPR > 0.24;
  const rateModerate = annualAPR > 0.15 && annualAPR <= 0.24;

  const ringColor = rateHigh
    ? { start: '#ef4444', end: '#f97316' }
    : rateModerate
      ? { start: '#f59e0b', end: '#f97316' }
      : { start: '#10b981', end: '#06b6d4' };

  // SVG ring
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(annualAPR / 0.36, 1);
  const offset = circumference * (1 - percent);

  const isForward = mode === 'forward';
  const monthlyPayment = schedule.length > 0 ? schedule[0].payment : 0;

  return (
    <View className={styles.resultCard}>
      {/* 头部 */}
      <View className={styles.cardHeader}>
        <View className={styles.headerAccent} />
        <View className={styles.cardHeaderRight}>
          <Text className={styles.cardTitle}>
            {isForward ? `${repayTypeLabel(repayType)} 月供` : '核算结果'}
          </Text>
          <Text className={styles.cardSubtitle}>
            {isForward ? '正向计算' : 'IRR 二分法精算'}
          </Text>
        </View>
      </View>

      {/* SVG 环形仪表盘 */}
      <View className={styles.gaugeSection}>
        <svg width="240" height="240" viewBox="0 0 240 240" className={styles.gaugeSvg}>
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={ringColor.start} />
              <stop offset="100%" stopColor={ringColor.end} />
            </linearGradient>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="120" cy="120" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="120" cy="120" r={radius}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 120 120)"
            filter="url(#ringGlow)"
            className={styles.gaugeArc}
          />
        </svg>
        {/* 中心 */}
        <View className={styles.gaugeCenter}>
          <Text className={styles.gaugeLabel}>
            {isForward ? '年化利率' : '实际年化'}
          </Text>
          <Text className={styles.gaugeValue} style={{ color: ringColor.start }}>
            {fmtPct(annualAPR)}
          </Text>
          <View className={styles.gaugeBadge} style={{ background: ringColor.start }}>
            <Text className={styles.gaugeBadgeText}>
              {rateHigh ? '偏高' : rateModerate ? '中等' : '正常'}
            </Text>
          </View>
        </View>
      </View>

      {/* 正向模式下突出月供 */}
      {isForward && (
        <View className={styles.pmtHighlight}>
          <Text className={styles.pmtLabel}>
            {repayType === 'interest-first' ? '每月付息' : repayType === 'equal-principal' ? '首月还款' : '每月还款'}
          </Text>
          <Text className={styles.pmtValue}>¥{fmtMoney(monthlyPayment)}</Text>
        </View>
      )}

      {/* 数据指标行 */}
      <View className={styles.metricsGrid}>
        <View className={styles.metricItem}>
          <View className={styles.metricDot} style={{ background: '#6366f1' }} />
          <Text className={styles.metricValue}>¥{fmtMoney(totalPayment)}</Text>
          <Text className={styles.metricLabel}>总还款</Text>
        </View>
        <View className={styles.metricItem}>
          <View className={styles.metricDot} style={{ background: '#f59e0b' }} />
          <Text className={styles.metricValue}>¥{fmtMoney(totalInterest)}</Text>
          <Text className={styles.metricLabel}>总利息</Text>
        </View>
        <View className={styles.metricItem}>
          <View className={styles.metricDot} style={{ background: '#06b6d4' }} />
          <Text className={styles.metricValue}>¥{fmtMoney(totalFee)}</Text>
          <Text className={styles.metricLabel}>总费用</Text>
        </View>
      </View>

      {/* 多收费判定 */}
      {isOvercharged !== null && (
        <View className={[styles.verdict, isOvercharged ? styles.verdictBad : styles.verdictGood].join(' ')}>
          <View className={[styles.verdictIcon, isOvercharged ? styles.verdictIconBad : styles.verdictIconGood].join(' ')}>
            <Text>{isOvercharged ? '!' : '✓'}</Text>
          </View>
          <Text className={styles.verdictText}>
            {isOvercharged
              ? `可能多收费 ¥${fmtMoney(Math.abs(overchargeAmount))}，请核实合同利率`
              : '利率与合同一致，未发现多收费'}
          </Text>
        </View>
      )}

      {onViewDetail && (
        <View className={styles.viewDetail} onClick={onViewDetail}>
          <Text cla