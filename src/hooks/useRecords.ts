import { useState, useCallback, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { CalcRecord, CalcResult, LoanInput } from '@/types/loan';

const STORAGE_KEY = 'calc_records';

export function useRecords() {
  const [records, setRecords] = useState<CalcRecord[]>([]);

  // 加载历史记录
  useEffect(() => {
    try {
      const data = Taro.getStorageSync(STORAGE_KEY);
      if (data && Array.isArray(data)) {
        setRecords(data);
      }
    } catch (e) {
      console.error('[Records] 加载失败:', e);
    }
  }, []);

  // 保存记录
  const saveRecord = useCallback((input: LoanInput, result: CalcResult) => {
    const record: CalcRecord = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      input,
      result,
    };
    const updated = [record, ...records].slice(0, 50);
    setRecords(updated);
    try {
      Taro.setStorageSync(STORAGE_KEY, updated);
    } catch (e) {
      console.error('[Records] 保存失败:', e);
    }
    return record;
  }, [records]);

  // 删除记录
  const deleteRecord = useCallback((id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    Taro.setStorageSync(STORAGE_KEY, updated);
  }, [records]);

  // 清空
  const clearAll = useCallback(() => {
    setRecords([]);
    Taro.setStorageSync(STORAGE_KEY, []);
  }, []);

  return { records, saveRecord, deleteRecord, clearAll };
}
