// src/utils/sync.js

const QUEUE_KEY = 'wirt_manager_offline_queue';

export const addToQueue = (action) => {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  queue.push({ ...action, timestamp: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const syncQueue = async () => {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (queue.length === 0) return;

  const remaining = [];
  for (const item of queue) {
    try {
      const response = await fetch('/api/inventur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!response.ok) throw new Error('Sync failed');
    } catch (err) {
      remaining.push(item);
    }
  }
  
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return remaining.length === 0;
};
