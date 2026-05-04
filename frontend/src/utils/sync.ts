import type { SyncItem } from '../types';
import { getToken } from '../api/client';

const QUEUE_KEY = 'wirt_manager_offline_queue';

export const addToQueue = (action: Omit<SyncItem, 'timestamp'>): void => {
  const queue: SyncItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  queue.push({ ...action, timestamp: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const syncQueue = async (): Promise<boolean> => {
  const queue: SyncItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  if (queue.length === 0) return true;

  const token = getToken();
  const remaining: SyncItem[] = [];

  for (const item of queue) {
    try {
      const res = await fetch('/api/inventur', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Sync failed');
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return remaining.length === 0;
};
