import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const configStr = fs.readFileSync('./firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);
const app = initializeApp(config);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function test() {
  try {
    const snap = await getDoc(doc(db, 'users', 'test'));
    console.log("SUCCESS. Doc exists:", snap.exists());
    process.exit(0);
  } catch(e) {
    console.log("ERROR:", e.message);
    process.exit(1);
  }
}
test();
