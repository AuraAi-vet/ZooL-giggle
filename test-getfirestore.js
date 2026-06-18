import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId); 

async function test() {
  try {
    const docRef = doc(db, "users", "test");
    await getDoc(docRef);
    console.log("Read success!");
    process.exit(0);
  } catch(e) {
    console.error("Read failure!", e.message);
    process.exit(1);
  }
}
test();
