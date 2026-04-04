import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

async function checkDefaultInit() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Try initializing without any arguments to use environment defaults
    const firebaseApp = getApps().length === 0 
      ? initializeApp() 
      : getApp();

    // Use the database ID from the config
    const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

    console.log("Attempting to read 'listings' collection with default init...");
    const snapshot = await db.collection('listings').limit(1).get();
    
    if (!snapshot.empty) {
      console.log("SUCCESS: Read listing data:", snapshot.docs[0].data());
    } else {
      console.log("Collection 'listings' is empty.");
    }

  } catch (error: any) {
    console.error("Default Init Failed:", error.message);
  }
}

checkDefaultInit();
