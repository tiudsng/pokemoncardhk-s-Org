import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const firebaseApp = getApps().length === 0 
  ? initializeApp({ projectId: firebaseConfig.projectId }) 
  : getApps()[0];

// Try without database ID
const db = getFirestore(firebaseApp);

async function listCollections() {
  try {
    const collections = await db.listCollections();
    console.log("Collections:", collections.map(c => c.id));
  } catch (e) {
    console.error("List Collections Failed:", e);
  }
}

listCollections();
