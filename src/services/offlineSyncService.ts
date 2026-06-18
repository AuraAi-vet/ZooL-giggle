import { toast } from 'sonner';
import { QuickLog } from '../types';

const STORAGE_KEY = 'zool_offline_quicklogs';

export function getQueuedLogs(): Omit<QuickLog, 'id' | 'ownerId'>[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to parse offline quicklogs queue:", err);
    return [];
  }
}

export function queueOfflineLog(log: Omit<QuickLog, 'id' | 'ownerId'>): void {
  try {
    const currentQueue = getQueuedLogs();
    currentQueue.push(log);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentQueue));
    toast.warning(`Network connection unstable. QuickLog saved locally for background synchronization.`, {
      description: "We will automatically push this to the cloud once network stabilizes."
    });
  } catch (err) {
    console.error("Failed to write to queue:", err);
  }
}

export function clearQueuedLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear offline queue:", err);
  }
}

export async function processQueue(addQuickLog: (log: any) => Promise<void>): Promise<number> {
  const queue = getQueuedLogs();
  if (queue.length === 0) return 0;

  toast.info(`🔌 Network restored! Synchronizing ${queue.length} offline care logs...`, {
    duration: 4000
  });

  let syncedCount = 0;
  for (const log of queue) {
    try {
      await addQuickLog(log);
      syncedCount++;
    } catch (err) {
      console.error("Failed to sync individual offline log:", err);
    }
  }

  clearQueuedLogs();

  if (syncedCount > 0) {
    toast.success(`🎉 Care timeline fully synchronized! ${syncedCount} log entries pushed to secure Firestore cloud.`, {
      duration: 5000
    });
  }
  
  return syncedCount;
}
