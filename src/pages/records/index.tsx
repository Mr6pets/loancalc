import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRecords } from '@/hooks/useRecords';
import { fmtMoney, fmtPct } from '@/utils/calc';
import EmptyState from '@/components/EmptyState';
import CustomTabBar from '@/components/CustomTabBar';
import styles from './index.module.scss';

export default function RecordsPage() {
  const { records, deleteRecord, clearAll, refresh } = useRecords();

  const handleViewDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  };

  // 统计
  const stats = useMemo(() => {
    const count = records.length;
    if (count === 0) return { count: 0, avg: 0, max: 0 };
    const rates = records.map(r => r.result.annualAPR);
    const avg = rates.reduce((a, b) => a + b, 0) / count;
    const max = Math.max(...rates);
    return { count, avg, max };
  }, [records]);

  const getRateClass = (apr: number, type: 'ring' | 'value' | 'label') => {
    if (apr > 0.24) return type === 'ring' ? styles.rateRingHigh : type === 'value' ? styles.rateValueHigh : styles.rateLabelHigh;
    if (apr > 0.15) return type === 'ring' ? styles.rateRingModerate : type === 'value' ? styles.rateValueModerate : styles.rateLabelModerate;
    return type === 'ring' ? styles.rateRingLow : type === 'value' ? styles.rateValueLow : styles.rateLabelLow;
  };

  const getBarClass = (apr: number) => {
    if (apr > 0.24) return styles.barHigh;
    if (apr > 0.15) return styles.barModerate;
    return styles.barLow;
  };

  const getRateLabel = (apr: number) => {
    if (apr > 0.24) return '偏高';
    if (apr > 0.15) return '中等';
    return '正常';
  };

  const renderContent = () => {
    if (records.length === 0) {
      return (
        <>
          <View className={styles.header}>
          <Text className={styles.headerTitle}>历史记录</Text>
          <Text className={styles.refreshBtn} onClick={refresh}>刷新</Text>
        </View>
        <View className={styles.summaryStrip}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>0</Text>
              <Text className={styles.summaryLabel}>次核算</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>--</Text>
              <Text className={styles.summaryLabel}>平均APR</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>--</Text>
              <Text className={styles.summaryLabel}>最高APR</Text>
            </View>
          </View>
          <EmptyState icon="📊" text="暂无计算记录" subText="在计算器页面完成核算后会自动保存" />
        </>
      );
    }

    return (
      <>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>历史记录</Text>
          <Text className={styles.refreshBtn} onClick={refresh}>刷新</Text>
        </View>

        <View className={styles.summaryStrip}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{stats.count}</Text>
            <Text className={styles.summaryLabel}>次核算</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{fmtPct(stats.avg)}</Text>
            <Text className={styles.summaryLabel}>平均APR</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{fmtPct(stats.max)}</Text>
            <Text className={styles.summaryLabel}>最高APR</Text>
          </View>
        </View>

        <View className={styles.list}>
          {records.map((record, idx) => {
            const { annualAPR } = record.result;
            return (
              <View
                key={record.id}
                className={styles.recordCard}
                onClick={() => handleViewDetail(record.id)}
                style={{ animation: `fadeInUp 0.4s ${idx * 0.06}s ease both` }}
              >
                <View className={styles.cardInner}>
                  {/* 左侧渐变色彩条 */}
                  <View className={[styles.colorBar, getBarClass(annualAPR)].join(' ')} />

                  <View className={styles.cardContent}>
                    {/* 头部：日期 + 删除 */}
                    <View className={styles.recordHeader}>
                      <Text className={styles.recordDate}>
                        <View className={styles.dateDot} />
                        {new Date(record.createdAt).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text
                        className={styles.recordDelete}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRecord(record.id);
                        }}
                      >
                        ✕ 删除
                      </Text>
                    </View>

                    {/* 主体：信息 + 利率 */}
                    <View className={styles.recordBody}>
                      <View className={styles.recordInfo}>
                        <Text className={styles.recordPrincipal}>
                          <Text className={styles.loanAmount}>¥{fmtMoney(record.input.principal)}</Text>
                          <Text className={styles.loanDivider}>·</Text>
                          <Text className={styles.loanMonths}>{record.input.months}期</Text>
                        </Text>
                        <Text className={styles.recordMonths}>
                          月供 ¥{fmtMoney(record.input.monthlyPayment)}
                          {record.input.contractRate ? (
                            <Text className={styles.contractTag}>合同 {record.input.contractRate}%</Text>
                          ) : null}
                        </Text>
                      </View>

                      {/* 利率胶囊 */}
                      <View className={styles.rateSection}>
                        <View className={[styles.rateRing, getRateClass(annualAPR, 'ring')].join(' ')}>
                          <Text className={[styles.rateValue, getRateClass(annualAPR, 'value')].join(' ')}>
                            {fmtPct(annualAPR)}
                          </Text>
                          <Text className={[styles.rateLabel, getRateClass(annualAPR, 'label')].join(' ')}>
                            {getRateLabel(annualAPR)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {records.length > 1 && (
            <View className={styles.clearBtn} onClick={clearAll}>
              <Text className={styles.clearText}>清空所有记录</Text>
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.scrollArea}>
        {renderContent()}
      </ScrollView>
      <CustomTabBar activeIndex={2} />
    </View>
  );
}
