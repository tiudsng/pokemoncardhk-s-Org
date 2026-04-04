import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

async function checkListings() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    const firebaseApp = getApps().length === 0 
      ? initializeApp({ projectId: firebaseConfig.projectId }) 
      : getApp();

    const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

    console.log("Attempting to read 'listings' collection...");
    const snapshot = await db.collection('listings').limit(1).get();
    
    if (!snapshot.empty) {
      console.log("SUCCESS: Read listing data:", snapshot.docs[0].data());
    } else {
      console.log("Collection 'listings' is empty.");
    }

  } catch (error: any) {
    console.error("Read Listings Failed:", error.message);
  }
}

checkListings();
