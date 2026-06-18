import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const dbStr = firebaseConfig.firestoreDatabaseId;
const dbCustom = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, dbStr);

async function test() {
  console.log(`Testing custom DB: ${dbStr}...`);
  try {
    const snap = await getDoc(doc(dbCustom, 'users', 'test'));
    console.log("Custom DB: Allowed (or not found)");
  } catch (error) {
    console.error("Custom DB Error:", error.message);
  }
  process.exit();
}
test();
