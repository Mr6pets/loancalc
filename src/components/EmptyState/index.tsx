import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  text?: string;
  subText?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📋', text = '暂无数据', subText }) => {
  return (
    <View className={styles.emptyState}>
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.text}>{text}</Text>
      {subText && <Text className={styles.subText}>{subText}</Text>}
    </View>
  );
};

export default EmptyState;
