import { z } from 'zod';
import aiStudioConfig from '../../firebase-applet-config.json';

const configSchema = z.object({
  apiKey: z.string().min(1, "Firebase API Key is required"),
  authDomain: z.string().min(1, "Firebase Auth Domain is required"),
  projectId: z.string().min(1, "Firebase Project ID is required"),
  storageBucket: z.string().optional(),
  messagingSenderId: z.string().optional(),
  appId: z.string().min(1, "Firebase App ID is required"),
  firestoreDatabaseId: z.string().optional(),
});

const getValue = (viteEnv: string | undefined, aiStudioConfigValue: string | undefined) => {
  const v1 = viteEnv?.trim();
  const isPlaceholder = v1 && (v1.includes('your-') || v1.includes('YOUR_') || v1 === 'undefined' || v1 === 'null' || v1 === '[]');
  if (v1 && !isPlaceholder) return v1;
  const v2 = aiStudioConfigValue?.trim();
  return v2 || undefined;
};

const configToValidate = {
  apiKey: getValue(import.meta.env.VITE_FIREBASE_API_KEY, aiStudioConfig.apiKey),
  authDomain: getValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, aiStudioConfig.authDomain),
  projectId: getValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, aiStudioConfig.projectId),
  storageBucket: getValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, aiStudioConfig.storageBucket),
  messagingSenderId: getValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, aiStudioConfig.messagingSenderId),
  appId: getValue(import.meta.env.VITE_FIREBASE_APP_ID, aiStudioConfig.appId),
  firestoreDatabaseId: getValue(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID, aiStudioConfig.firestoreDatabaseId),
};

let validatedFirebaseConfig;

try {
  validatedFirebaseConfig = configSchema.parse(configToValidate);
} catch (error) {
  console.error("Environment Configuration Error: Missing or invalid Firebase variables.", error);
  throw new Error("Invalid Environment Configuration. Check your environment variables.");
}

export const env = {
  firebase: validatedFirebaseConfig
};
