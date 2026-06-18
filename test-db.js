import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const rawConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp({
  projectId: rawConfig.projectId
});

const db = getFirestore(app, rawConfig.firestoreDatabaseId);

async function test() {
  try {
    const docRef = db.collection('test').doc('test');
    await docRef.set({ test: true });
    console.log('Success Admin DB');
  } catch (e) {
    console.error('Error Admin DB', e);
  }
}
test();
