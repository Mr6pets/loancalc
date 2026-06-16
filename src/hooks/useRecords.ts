import { useState, useCallback, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { CalcRecord, CalcResult, LoanInput } from '@/types/loan';

const STORAGE_KEY = 'calc_records';
const API_BASE = process.env.TARO_APP_API_BASE || '';

/** JSON -> Record */
function toRecord(row: {
  id: string;
  createdAt: string;
  input: LoanInput;
  result: CalcResult;
}): CalcRecord {
  return {
    id: row.id,
    createdAt: row.createdAt,
    input: row.input,
    result: row.result,
  };
}

/** 同步服务器 -> localStorage */
function syncToLocal(records: CalcRecord[]) {
  try {
    Taro.setStorageSync(STORAGE_KEY, records);
  } catch (_) { /* ignore */ }
}

export function useRecords() {
  const [records, setRecords] = useState<CalcRecord[]>([]);
  const [apiAvailable, setApiAvailable] = useState<boolean>(!!API_BASE);

  // 初始化：先试 API，失败则读本地
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!API_BASE) {
        loadLocal();
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/records`);
        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.data)) {
          const list = json.data.map(toRecord);
          setRecords(list);
          setApiAvailable(true);
          syncToLocal(list);
          return;
        }
      } catch (_) {
        // API 不可用，走本地
      }
      if (!cancelled) {
        setApiAvailable(false);
        loadLocal();
      }
    }

    function loadLocal() {
      try {
        const data = Taro.getStorageSync(STORAGE_KEY);
        if (data && Array.isArray(data)) {
          setRecords(data);
        }
      } catch (_) { /* ignore */ }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // 保存记录
  const saveRecord = useCallback((input: LoanInput, result: CalcResult) => {
    const record: CalcRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      input,
      result,
    };

    // 乐观更新
    const updated = [record, ...records].slice(0, 100);
    setRecords(updated);
    syncToLocal(updated);

    // 异步写 API
    if (API_BASE) {
      fetch(`${API_BASE}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch(() => {});
    }

    return record;
  }, [records]);

  // 删除记录
  const deleteRecord = useCallback((id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    syncToLocal(updated);

    if (API_BASE) {
      fetch(`${API_BASE}/api/records/${encodeURIComponent(id)}`, { method: 'DELETE' })
        .catch(() => {});
    }
  }, [records]);

  // 清空
  const clearAll = useCallback(() => {
    setRecords([]);
    syncToLocal([]);

    if (API_BASE) {
      fetch(`${API_BASE}/api/records`, { method: 'DELETE' })
        .catch(() => {});
    }
  }, []);

  return { records, saveRecord, deleteRecord, clearAll, apiAvailable };
}
