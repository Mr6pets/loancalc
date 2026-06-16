import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useRecords } from '@/hooks/useRecords';
import { calculate, fmtPct, fmtMoney } from '@/utils/calc';
import BackButton from '@/components/BackButton';
import styles from './index.module.scss';

export default function DetailPage() {
  const router = useRouter();
  const { id } = router.params;
  const { records } = useRecords();

  const record = useMemo(() => {
    return records.find(r => r.id === id) || null;
  }, [records, id]);

  if (!record) {
    return (
      <View className={styles.page}>
        <BackButton />
        <View className={styles.header}>
          <Text className={styles.headerTitle}>记录详情</Text>
          <Text className={styles.headerLabel}>未找到该记录</Text>
        </View>
      </View>
    );
  }

  const result = useMemo(() => calculate(record.input), [record]);
  const { annualAPR, totalPayment, totalInterest, totalFee, isOvercharged, overchargeAmount, monthlyRate, annualNominalRate } = result;

  return (
    <ScrollView className={styles.page} scrollY>
      <BackButton />
      <View className={styles.header}>
        <Text className={styles.headerTitle}>实际年化利率</Text>
        <Text className={styles.headerRate}>{fmtPct(annualAPR)}</Text>
        <Text className={styles.headerLabel}>
          {new Date(record.createdAt).toLocaleString('zh-CN')}
        </Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>贷款参数</Text>
        <View className={styles.row}>
          <Text className={styles.label}>贷款本金</Text>
          <Text className={styles.value}>¥{fmtMoney(record.input.principal)}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>总期数</Text>
          <Text className={styles.value}>{record.input.months} 期</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>月还款额</Text>
          <Text className={styles.value}>¥{fmtMoney(record.input.monthlyPayment)}</Text>
        </View>
        {record.input.contractRate !== undefined && (
          <View className={styles.row}>
            <Text className={styles.label}>合同年利率</Text>
            <Text className={styles.value}>{record.input.contractRate}%</Text>
          </View>
        )}
        {record.input.upfrontFee ? (
          <View className={styles.row}>
            <Text className={styles.label}>前置费用</Text>
            <Text className={styles.value}>¥{fmtMoney(record.input.upfrontFee)}</Text>
          </View>
        ) : null}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>计算结果</Text>
        <View className={styles.row}>
          <Text className={styles.label}>月利率</Text>
          <Text className={styles.value}>{fmtPct(monthlyRate, 4)}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>名义年利率</Text>
          <Text className={styles.value}>{fmtPct(annualNominalRate)}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>实际年化 (APR)</Text>
          <Text className={styles.value}>{fmtPct(annualAPR)}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>总还款</Text>
          <Text className={styles.value}>¥{fmtMoney(totalPayment)}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>总利息</Text>
          <Text className={styles.value}>¥{fmtMoney(totalInterest)}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>总费用</Text>
          <Text className={styles.value}>¥{fmtMoney(totalFee)}</Text>
        </View>
      </View>

      {isOvercharged !== null && (
        <View className={[styles.verdict, isOvercharged ? styles.verdictBad : styles.verdictGood].join(' ')}>
          <Text className={styles.verdictText}>
            {isOvercharged
              ? `可能多收费 ¥${fmtMoney(Math.abs(overchargeAmount))}`
              : '利率与合同一致，未发现多收费'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
