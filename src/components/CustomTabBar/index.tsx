import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface TabItem {
  pagePath: string;
  text: string;
}

const TAB_LIST: TabItem[] = [
  { pagePath: 'pages/index/index', text: '计算' },
  { pagePath: 'pages/bills/index', text: '账单' },
  { pagePath: 'pages/records/index', text: '记录' },
  { pagePath: 'pages/mine/index', text: '我的' },
];

function SvgCalc(active: boolean) {
  const c = active ? 'url(#tg1)' : '#9ca3af';
  return (
    <View className={styles.svgWrap}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <defs>
          <linearGradient id="tg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect x="7" y="9" width="30" height="26" rx="4" fill="none" stroke={c} strokeWidth="2.2" />
        <line x1="7" y1="17" x2="37" y2="17" stroke={c} strokeWidth="2.2" />
        <line x1="14" y1="22" x2="30" y2="22" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="14" y1="27" x2="24" y2="27" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="30" cy="29" r="5" fill="none" stroke={c} strokeWidth="2.2" />
        <line x1="33" y1="32" x2="37" y2="36" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </View>
  );
}

function SvgBills(active: boolean) {
  const c = active ? 'url(#tg2)' : '#9ca3af';
  return (
    <View className={styles.svgWrap}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <defs>
          <linearGradient id="tg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect x="10" y="6" width="24" height="32" rx="3" fill="none" stroke={c} strokeWidth="2.2" />
        <line x1="15" y1="14" x2="29" y2="14" stroke={c} strokeWidth="2" strokeLinecap="round" />
        <line x1="15" y1="20" x2="29" y2="20" stroke={c} strokeWidth="2" strokeLinecap="round" />
        <line x1="15" y1="26" x2="24" y2="26" stroke={c} strokeWidth="2" strokeLinecap="round" />
        <rect x="17" y="31" width="10" height="4" rx="2" fill={c} />
      </svg>
    </View>
  );
}

function SvgRecords(active: boolean) {
  const c = active ? 'url(#tg3)' : '#9ca3af';
  return (
    <View className={styles.svgWrap}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <defs>
          <linearGradient id="tg3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="22" cy="10" r="4" fill="none" stroke={c} strokeWidth="2.2" />
        <path d="M14 32 C14 24 16 22 22 22 C28 22 30 24 30 32" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
        <rect x="8" y="34" width="28" height="2" rx="1" fill={c} />
        <line x1="22" y1="32" x2="22" y2="36" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </View>
  );
}

function SvgMine(active: boolean) {
  const c = active ? 'url(#tg4)' : '#9ca3af';
  return (
    <View className={styles.svgWrap}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <defs>
          <linearGradient id="tg4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="22" cy="16" r="6" fill="none" stroke={c} strokeWidth="2.2" />
        <path d="M10 38 C10 29 15 26 22 26 C29 26 34 29 34 38" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </View>
  );
}

const iconComponents = [SvgCalc, SvgBills, SvgRecords, SvgMine];

interface Props {
  activeIndex: number;
}

export default function CustomTabBar({ activeIndex }: Props) {

  const handleSwitch = (tab: TabItem, index: number) => {
    if (index === activeIndex) return;
    Taro.switchTab({ url: `/${tab.pagePath}` });
  };

  return (
    <View className={styles.tabBar}>
      <View className={styles.indicatorTrack}>
        <View
          className={styles.indicator}
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
      </View>

      {TAB_LIST.map((tab, idx) => {
        const active = idx === activeIndex;
        const IconComp = iconComponents[idx];
        return (
          <View
            key={tab.pagePath}
            className={[styles.tabItem, active ? styles.tabActive : ''].join(' ')}
            onClick={() => handleSwitch(tab, idx)}
          >
            {IconComp(active)}
            <Text className={[styles.tabLabel, active ? styles.tabLabelActive : ''].join(' ')}>
              {tab.text}
            </Text>
            {active && <View className={styles.activeDot} />}
          </View>
        );
      })}
    </View>
  );
}
