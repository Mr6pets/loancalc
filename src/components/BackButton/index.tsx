import React from 'react';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

export default function BackButton() {
  return (
    <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 19L8 12L15 5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </View>
  );
}
