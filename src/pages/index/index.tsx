import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { LoanInput, CalcResult, RepayType, CalcMode, CashFlow } from '@/types/loan';
import { calculate, repayTypeLabel } from '@/utils/calc';
import { useRecords } from '@/hooks/useRecords';
import CalcCard from '@/components/CalcCard';
import ResultCard from '@/components/ResultCard';
import CustomTabBar from '@/components/CustomTabBar';
import styles from './index.module.scss';

export default function IndexPage() {
  const [result, setResult] = useState<CalcResult | null>(null);
  const [lastInput, setLastInput] = useState<LoanInput | null>(null);
  const { records, saveRecord } = useRecords();

  const handleCalc = useCallback((data: {
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
  }) => {
    const input: LoanInput = {
      principal: data.principal,
      months: data.months,
      monthlyPayment: data.monthlyPayment,
      repayType: data.repayType,
      mode: data.mode,
      annualRate: data.annualRate,
      contractRate: data.contractRate,
      upfrontFee: data.upfrontFee,
      flows: data.flows,
      startDate: data.startDate,
    };
    const res = calculate(input);
    setResult(res);
    setLastInput(input);
    saveRecord(input, res);
  }, [saveRecord]);

  const handleViewDetail = useCallback(() => {
    if (!result || !lastInput) return;
    Taro.navigateTo({ url: '/pages/result/index' });
  }, [result, lastInput]);

  const resultTitle = result
    ? result.mode === 'forward'
      ? `${repayTypeLabel(result.repayType)} 计算结果`
      : result.mode === 'flow'
        ? '流水分析结果'
        : '核算结果'
    : '核算结果';

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.scrollArea}>
        {/* 炫酷 Hero 区域 */}
        <View className={styles.hero}>
          <View className={styles.heroBg} />
          <View className={styles.heroBg2} />
          <View className={styles.heroBg3} />
          <View className={styles.heroContent}>
            <View className={styles.heroBadge}>
              <View className={styles.badgeRing} />
              <Text className={styles.badgeText}>IRR 精算引擎</Text>
            </View>
            <Text className={styles.heroTitle}>
              贷款利率{' '}
              <Text className={styles.heroTitleAccent}>一秒核算</Text>
            </Text>
            <Text className={styles.heroSub}>
              支持等额本息 / 等额本金 / 先息后本，正反向计算
            </Text>
          </View>
        </View>

        {/* 快速统计卡片 */}
        <View className={styles.quickStats}>
          <View className={styles.statCard}>
            <svg width="36" height="36" viewBox="0 0 36 36" className={styles.statSvg}>
              <defs>
                <linearGradient id="sq1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="15" fill="none" stroke="url(#sq1)" strokeWidth="2.2" strokeDasharray="6 3" opacity="0.6"/>
              <polyline points="10,18 15,23 26,12" fill="none" stroke="url(#sq1)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Text className={styles.statValue}>即输即算</Text>
            <Text className={styles.statLabel}>秒出结果</Text>
          </View>
          <View className={styles.statCard}>
            <svg width="36" height="36" viewBox="0 0 36 36" className={styles.statSvg}>
              <defs>
                <linearGradient id="sq2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#ec4899"/>
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="15" fill="none" stroke="url(#sq2)" strokeWidth="2.2" strokeDasharray="6 3" opacity="0.6"/>
              <circle cx="18" cy="10" r="4" fill="none" stroke="url(#sq2)" strokeWidth="2.4"/>
              <circle cx="10" cy="22" r="2.5" fill="none" stroke="url(#sq2)" strokeWidth="2"/>
              <circle cx="26" cy="22" r="2.5" fill="none" stroke="url(#sq2)" strokeWidth="2"/>
              <line x1="18" y1="14" x2="11" y2="21" stroke="url(#sq2)" strokeWidth="1.5"/>
              <line x1="18" y1="14" x2="25" y2="21" stroke="url(#sq2)" strokeWidth="1.5"/>
            </svg>
            <Text className={styles.statValue}>IRR 精算</Text>
            <Text className={styles.statLabel}>金融级精度</Text>
          </View>
          <View className={styles.statCard}>
            <svg width="36" height="36" viewBox="0 0 36 36" className={styles.statSvg}>
              <defs>
                <linearGradient id="sq3" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="15" fill="none" stroke="url(#sq3)" strokeWidth="2.2" strokeDasharray="6 3" opacity="0.6"/>
              <rect x="9" y="8" width="18" height="20" rx="3" fill="none" stroke="url(#sq3)" strokeWidth="2.2"/>
              <line x1="9" y1="14" x2="27" y2="14" stroke="url(#sq3)" strokeWidth="2"/>
              <line x1="13" y1="19" x2="23" y2="19" stroke="url(#sq3)" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="13" y1="23" x2="19" y2="23" stroke="url(#sq3)" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <Text className={styles.statValue}>{records.length}</Text>
            <Text className={styles.statLabel}>条记录</Text>
          </View>
        </View>

        <View className={styles.content}>
          <Text className={styles.sectionTitle}>填写贷款信息</Text>
          <CalcCard onSubmit={handleCalc} />
        </View>

        {result && (
          <>
            <Text className={styles.sectionTitle}>{resultTitle}</Text>
            <ResultCard result={result} onViewDetail={handleViewDetail} />
          </>
        )}
      </ScrollView>
      <CustomTabBar activeIndex={0} />
    </View>
  );
}
