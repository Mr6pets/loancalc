import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { useRecords } from '@/hooks/useRecords';
import { CalcResult } from '@/types/loan';
import { calculate, fmtPct, fmtMoney } from '@/utils/calc';
import BackButton from '@/components/BackButton';
import styles from './index.module.scss';

export default function ResultPage() {
  const { records } = useRecords();
  const record = records[0]; // 取最新记录

  const result: CalcResult | null = useMemo(() => {
    if (!record) return null;
    return calculate(record.input);
  }, [record]);

  if (!result) {
    return (
      <View className={styles.page}>
        <BackButton />
        <View className={styles.header}>
          <Text className={styles.headerTitle}>还款明细</Text>
          <Text className={styles.headerRateLabel}>暂无数据，请先在计算器完成核算</Text>
        </View>
      </View>
    );
  }

  const { annualAPR, totalPayment, totalInterest, schedule, isOvercharged, overchargeAmount } = result;

  return (
    <ScrollView className={styles.page} scrollY>
      <BackButton />
      <View className={styles.header}>
        <Text className={styles.headerTitle}>实际年化利率</Text>
        <Text className={styles.headerRate}>{fmtPct(annualAPR)}</Text>
        <Text className={styles.headerRateLabel}>年化利率 (APR)</Text>
      </View>

      <View className={styles.summaryCard}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>总还款额</Text>
          <Text className={styles.summaryValue}>¥{fmtMoney(totalPayment)}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>总利息</Text>
          <Text className={styles.summaryValue}>¥{fmtMoney(totalInterest)}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>总期数</Text>
          <Text className={styles.summaryValue}>{schedule.length} 期</Text>
        </View>
      </View>

      {isOvercharged !== null && (
        <View className={[styles.verdictCard, isOvercharged ? styles.verdictBad : styles.verdictGood].join(' ')}>
          <Text className={[styles.verdictText, isOvercharged ? styles.bad : styles.good].join(' ')}>
            {isOvercharged
              ? `可能多收费 ¥${fmtMoney(Math.abs(overchargeAmount))}，请核实合同利率`
              : '利率与合同一致，未发现多收费'}
          </Text>
        </View>
      )}

      <Text className={styles.sectionTitle}>还款明细表</Text>

      <View className={styles.tableCard}>
        <View className={styles.tableHeader}>
          <Text className={styles.tableCol}>期数</Text>
          <Text className={styles.tableCol}>本金</Text>
          <Text className={styles.tableCol}>利息</Text>
          <Text className={styles.tableCol}>月供</Text>
          <Text className={styles.tableCol}>剩余</Text>
        </View>
        {schedule.map(item => (
          <View key={item.period} className={styles.tableRow}>
            <Text className={styles.tableCell}>{item.period}</Text>
            <Text className={styles.tableCell}>¥{fmtMoney(item.principal)}</Text>
            <Text className={styles.tableCell}>¥{fmtMoney(item.interest)}</Text>
            <Text className={styles.tableCell}>¥{fmtMoney(item.payment)}</Text>
            <Text className={styles.tableCell}>¥{fmtMoney(item.remaining)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
