import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import aiStudioConfig from '../../firebase-applet-config.json';

setLogLevel('silent');

const app = initializeApp(aiStudioConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, aiStudioConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/docs');

// Cache the access token in memory.
let cachedAccessToken: string | null = null;

export const setAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const clearAccessToken = () => {
  cachedAccessToken = null;
};
