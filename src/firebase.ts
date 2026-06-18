import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, enableMultiTabIndexedDbPersistence, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.error("FIREBASE CONFIG ERROR: apiKey is missing!", firebaseConfig);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling enabled to bypass network restrictions in sandboxed iframe environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);

// Enable Offline Persistence for zero-latency instant loading and offline queuing
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        enableIndexedDbPersistence(db).catch((err2) => {
          console.error("Firestore single-tab persistence failed to enable:", err2);
        });
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn("Firestore persistence is not supported by the browser.");
      } else {
        console.error("Firestore multi-tab persistence failed:", err);
      }
    });
}

export const auth = getAuth(app);
export const storage = getStorage(app);

// Validate Connection to Firestore as per integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore Connection Warning: The client is offline. Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Initialize Messaging conditionally (only supported in browsers)
export const messaging = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export default app;
