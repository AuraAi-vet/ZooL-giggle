import { processQueue, getQueuedLogs } from './offlineSyncService';

class BackgroundSyncManager {
  private isProcessing = false;

  init(addQuickLog: (log: any) => Promise<void>, setSyncStatus: (status: 'synced' | 'syncing' | 'error' | null) => void) {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.retryFailedTransactions(addQuickLog, setSyncStatus);
    });
    
    window.addEventListener('offline', () => {
       setSyncStatus('error');
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NETWORK_RECONNECTED') {
          this.retryFailedTransactions(addQuickLog, setSyncStatus);
        }
      });
      
      navigator.serviceWorker.ready.then(swRegistration => {
        if ('sync' in swRegistration) {
          (swRegistration as any).sync.register('zool-offline-sync').catch((err: any) => {
            console.log('Background Sync API not supported or failed to register:', err);
          });
        }
      });
    }
    
    // Initial check
    if (navigator.onLine) {
       this.retryFailedTransactions(addQuickLog, setSyncStatus);
    }
  }

  async retryFailedTransactions(addQuickLog: (log: any) => Promise<void>, setSyncStatus: (status: 'synced' | 'syncing' | 'error' | null) => void) {
    if (this.isProcessing) return;
    if (!navigator.onLine) {
      setSyncStatus('error');
      return;
    }
    
    const queue = getQueuedLogs();
    if (queue.length === 0) return;

    this.isProcessing = true;
    setSyncStatus('syncing');
    
    try {
      await processQueue(addQuickLog);
      setSyncStatus('synced');
    } catch (err) {
      console.error("Background sync transaction failed:", err);
      setSyncStatus('error');
    } finally {
      this.isProcessing = false;
    }
  }
}

export const backgroundSyncManager = new BackgroundSyncManager();
