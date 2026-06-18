import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { env } from './env';

setLogLevel('silent');

const app = initializeApp(env.firebase);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, env.firebase.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

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
