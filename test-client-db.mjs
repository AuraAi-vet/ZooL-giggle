import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    await setDoc(doc(db, 'test', 'test'), { hello: 'world' });
    console.log('Success Client DB');
  } catch (e) {
    console.error('Error Client DB', e);
  } finally {
    await deleteApp(app);
  }
}
test();
