import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import CustomTabBar from '@/components/CustomTabBar';
import styles from './index.module.scss';

export default function MinePage() {
  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.scrollArea}>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>我的</Text>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>📖 使用说明</Text>
          <Text className={styles.desc}>
            1. 在计算器页面输入贷款本金、期数、月还款额{'\n'}
            2. 可选择填写合同约定年利率，用于对比是否多收费{'\n'}
            3. 点击"开始核算"即可得到真实年化利率{'\n'}
            4. 计算结果自动保存，可在历史记录中查看{'\n'}
            5. 账单分析页面展示真实案例数据供参考
          </Text>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>📐 常见概念</Text>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>APR 年化利率</Text>
            <Text className={styles.itemValue}>复利计算真实利率</Text>
          </View>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>名义年利率</Text>
            <Text className={styles.itemValue}>月利率 × 12</Text>
          </View>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>IRR 内部收益率</Text>
            <Text className={styles.itemValue}>考虑时间价值</Text>
          </View>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>等额本息</Text>
            <Text className={styles.itemValue}>每月还款金额固定</Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>❓ 常见问题</Text>
          <View className={styles.faqItem}>
            <Text className={styles.faqQ}>Q: 为什么银行说的费率和我算的不一样？</Text>
            <Text className={styles.faqA}>
              A: 银行宣传的通常是"月手续费率"，而本工具计算的是包含时间价值的真实年化利率(APR)，两者差异可能很大。
            </Text>
          </View>
          <View className={styles.faqItem}>
            <Text className={styles.faqQ}>Q: 多少利率算合理？</Text>
            <Text className={styles.faqA}>
              A: 2024年消费贷产品APR通常在 3.5%~15% 之间。2017年信用卡现金分期产品 APR 在 11%~19% 区间较为常见。超过24%需警惕。
            </Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>ℹ️ 关于</Text>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>版本</Text>
            <Text className={styles.itemValue}>1.0.0</Text>
          </View>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>功能</Text>
            <Text className={styles.itemValue}>贷款利率核算与验证</Text>
          </View>
          <View className={styles.itemRow}>
            <Text className={styles.itemLabel}>引擎</Text>
            <Text className={styles.itemValue}>IRR 二分法精算</Text>
          </View>
        </View>
      </ScrollView>
      <CustomTabBar activeIndex={3} />
    </View>
  );
}
