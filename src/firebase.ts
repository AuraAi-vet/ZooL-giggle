import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
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
