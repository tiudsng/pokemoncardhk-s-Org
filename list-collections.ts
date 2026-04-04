import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

async function listCollections() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    const firebaseApp = getApps().length === 0 
      ? initializeApp({ projectId: firebaseConfig.projectId }) 
      : getApp();

    console.log("Using Project ID:", firebaseApp.options.projectId);
    const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

    console.log("Listing collections in database:", firebaseConfig.firestoreDatabaseId);
    const collections = await db.listCollections();
    console.log("Collections found:", collections.map(c => c.id));

  } catch (error: any) {
    console.error("List Collections Failed:", error.message);
  }
}

listCollections();
