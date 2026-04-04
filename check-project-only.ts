import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

async function checkProjectOnly() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    const firebaseApp = getApps().length === 0 
      ? initializeApp({ projectId: firebaseConfig.projectId }) 
      : getApp();

    // Try without database ID
    const db = getFirestore(firebaseApp);

    console.log("Attempting to list collections for project:", firebaseConfig.projectId, "without database ID...");
    const collections = await db.listCollections();
    console.log("Collections found:", collections.map(c => c.id));

  } catch (error: any) {
    console.error("Project Only Check Failed:", error.message);
  }
}

checkProjectOnly();
