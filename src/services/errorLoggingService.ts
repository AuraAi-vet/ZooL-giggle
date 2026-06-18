import { db, auth } from '../firebase';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

interface ErrorLog {
  errorName: string;
  errorMessage: string;
  componentStack: string;
  timestampStr: string;
  type: string;
}

let errorLogQueue: ErrorLog[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
const BATCH_FLUSH_INTERVAL_MS = 5000;

export const logErrorToBatch = (error: ErrorLog) => {
  errorLogQueue.push(error);
  
  if (!batchTimeout) {
    batchTimeout = setTimeout(flushErrorLogs, BATCH_FLUSH_INTERVAL_MS);
  }
};

export const flushErrorLogs = async () => {
  if (errorLogQueue.length === 0) return;
  
  const batchToUpload = [...errorLogQueue];
  errorLogQueue = [];
  
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
  
  try {
    const batch = writeBatch(db);
    batchToUpload.forEach((log) => {
      const logRef = doc(collection(db, 'aiInteractionLogs'));
      batch.set(logRef, {
        userId: auth.currentUser?.uid || 'anonymous',
        ...log,
        timestamp: serverTimestamp(),
      });
    });
    
    await batch.commit();
    console.log(`Telemetry: Flushed ${batchToUpload.length} error logs to aiInteractionLogs.`);
  } catch (err) {
    console.error("Telemetry: flushErrorLogs failed", err);
    // Put them back in queue
    errorLogQueue = [...batchToUpload, ...errorLogQueue];
  }
};
