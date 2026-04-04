import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

async function checkAdminPermissions() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    const firebaseApp = getApps().length === 0 
      ? initializeApp({ projectId: firebaseConfig.projectId }) 
      : getApp();

    const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

    console.log("Attempting to read 'analytics/traffic' document...");
    const statsDoc = await db.collection('analytics').doc('traffic').get();
    
    if (statsDoc.exists) {
      console.log("SUCCESS: Read analytics data:", statsDoc.data());
    } else {
      console.log("Document 'analytics/traffic' does not exist yet.");
    }

    console.log("Attempting to write to 'analytics/traffic' document...");
    await db.collection('analytics').doc('traffic').set({ test: "success" }, { merge: true });
    console.log("SUCCESS: Wrote to analytics data.");

  } catch (error: any) {
    console.error("Admin Permission Check Failed:", error.message);
    console.error("Error Details:", JSON.stringify(error, null, 2));
    if (error.stack) console.error(error.stack);
  }
}

checkAdminPermissions();
