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
  const { annualAPR, totalInterest, totalFee, totalPayment, isOvercharged, overchargeAmount, mode, repayType, schedule, parsedFlows } = result;
  const rateHigh = annualAPR > 0.24;
  const rateModerate = annualAPR > 0.15 && annualAPR <= 0.24;

  const ringColor = rateHigh
    ? { start: '#ef4444', end: '#f97316' }
    : rateModerate
      ? { start: '#f59e0b', end: '#f97316' }
      : { start: '#10b981', end: '#06b6d4' };

  // 环形百分比
  const percent = Math.min(annualAPR / 0.36, 1);

  const isForward = mode === 'forward';
  const isFlow = mode === 'flow';
  const monthlyPayment = schedule.length > 0 ? schedule[0].payment : 0;

  return (
    <View className={styles.resultCard}>
      {/* 头部 */}
      <View className={styles.cardHeader}>
        <View className={styles.headerAccent} />
        <View className={styles.cardHeaderRight}>
          <Text className={styles.cardTitle}>
            {isFlow ? 'XIRR 流水分析' : isForward ? `${repayTypeLabel(repayType)} 月供` : '核算结果'}
          </Text>
          <Text className={styles.cardSubtitle}>
            {isFlow ? '不规则现金流 IRR' : isForward ? '正向计算' : 'IRR 二分法精算'}
          </Text>
        </View>
      </View>

      {/* SVG 环形仪表盘 */}
      <View className={styles.gaugeSection}>
        <svg width="260" height="260" viewBox="0 0 260 260" className={styles.gaugeSvg}>
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={ringColor.start} />
              <stop offset="100%" stopColor={ringColor.end} />
            </linearGradient>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* 背景轨道 */}
          <circle cx="130" cy="130" r="100" fill="none" stroke="#e8ecf1" strokeWidth="14" />
          <circle cx="130" cy="130" r="100" fill="none" stroke="#f0f2f5" strokeWidth="8" opacity="0.6" />
          {/* 激活弧线 */}
          <circle
            cx="130" cy="130" r="100"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 100}
            strokeDashoffset={2 * Math.PI * 100 * (1 - percent)}
            transform="rotate(-90 130 130)"
            filter="url(#ringGlow)"
            className={styles.gaugeArc}
          />
        </svg>
        {/* 中心文字 */}
        <View className={styles.gaugeCenter}>
          <Text className={styles.gaugeLabel}>
            {isFlow ? '流水 XIRR' : isForward ? '年化利率' : '实际年化'}
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

      {/* 流水模式：笔数 + 均额 */}
      {isFlow && (
        <View className={styles.pmtHighlight}>
          <Text className={styles.pmtLabel}>
            {parsedFlows ? parsedFlows.length : schedule.length} 笔还款 · 均额
          </Text>
          <Text className={styles.pmtValue}>
            ¥{fmtMoney(schedule.length > 0 ? totalPayment / schedule.length : 0)}
          </Text>
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
          <View className={styles.metricDot} style={{ background: isFlow ? '#10b981' : '#06b6d4' }} />
          <Text className={styles.metricValue}>
            {isFlow ? `${schedule.length}笔` : `¥${fmtMoney(totalFee)}`}
          </Text>
          <Text className={styles.metricLabel}>{isFlow ? '流水笔数' : '总费用'}</Text>
        </View>
      </View>

      {/* 流水模式：流水明细截断预览 */}
      {isFlow && parsedFlows && parsedFlows.length > 0 && (
        <View className={styles.flowMiniList}>
          {parsedFlows.slice(0, 6).map((f, i) => (
            <View key={i} className={styles.flowMiniItem}>
              <Text className={styles.flowMiniDate}>{f.date || `第${i + 1}期`}</Text>
              <Text className={styles.flowMiniAmt}>¥{fmtMoney(f.amount)}</Text>
            </View>
          ))}
          {parsedFlows.length > 6 && (
            <Text className={styles.flowMiniMore}>...共 {parsedFlows.length} 笔</Text>
          )}
        </View>
      )}

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
          <Text className={styles.viewDetailText}>查看还款明细</Text>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="url(#arrowGrad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4f46e5"/>
                <stop offset="100%" stopColor="#06b6d4"/>
              </linearGradient>
            </defs>
          </svg>
        </View>
      )}
    </View>
  );
};

export default ResultCard;
