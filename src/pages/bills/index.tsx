import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { demoBills, demoSummary } from '@/data/bills';
import { fmtMoney, fmtPct } from '@/utils/calc';
import CustomTabBar from '@/components/CustomTabBar';
import styles from './index.module.scss';

export default function BillsPage() {
  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.scrollArea}>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>账单分析</Text>
          <Text className={styles.headerSub}>支持上传信用卡账单 PDF，自动提取分期数据并核算利率</Text>
        </View>

        <View className={styles.noteCard}>
          <Text className={styles.noteIcon}>💡</Text>
          <Text className={styles.noteText}>
            注意：完整的 PDF 账单解析功能需后端服务配合，当前展示基于实际账单提取的演示数据（浦发万用金 2017-2020 真实账单）。
          </Text>
        </View>

        <View className={styles.summaryCard}>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>放款本金</Text>
            <Text className={styles.summaryValue}>¥{fmtMoney(demoSummary.principal)}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>期数</Text>
            <Text className={styles.summaryValue}>{demoSummary.months} 期</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>月还款</Text>
            <Text className={styles.summaryValue}>¥{fmtMoney(demoSummary.monthlyPayment)}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>总利息</Text>
            <Text className={styles.summaryValue}>¥{fmtMoney(demoSummary.totalInterest)}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>实际年化 APR</Text>
            <Text className={styles.summaryValue}>{fmtPct(demoSummary.apr)}</Text>
          </View>
        </View>

        <View className={styles.demoCard}>
          <Text className={styles.demoTitle}>还款明细（前10期）</Text>
          <Text className={styles.demoDesc}>
            数据来自 2017年12月~2020年11月 浦发万用金真实账单，共36期，月利率 1.46%
          </Text>
          <View className={styles.billTable}>
            <View className={styles.tableHeader}>
              <Text className={styles.tableCell}>期数</Text>
              <Text className={styles.tableCell}>月份</Text>
              <Text className={styles.tableCell}>本金</Text>
              <Text className={styles.tableCell}>利息</Text>
            </View>
            {demoBills.map((bill) => (
              <View key={bill.period} className={styles.tableRow}>
                <Text className={styles.tableCellValue}>{bill.period}</Text>
                <Text className={styles.tableCellValue}>{bill.month}</Text>
                <Text className={styles.tableCellValue}>¥{fmtMoney(bill.principal)}</Text>
                <Text className={styles.tableCellValue}>¥{fmtMoney(bill.interest)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <CustomTabBar activeIndex={1} />
    </View>
  );
}
