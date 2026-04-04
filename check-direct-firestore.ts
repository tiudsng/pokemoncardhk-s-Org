import { Firestore, FieldValue } from "@google-cloud/firestore";
import path from "path";
import fs from "fs";

async function checkDirectFirestore() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    const db = new Firestore({
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId
    });

    console.log("Attempting to read 'listings' collection with direct Firestore client...");
    const snapshot = await db.collection('listings').limit(1).get();
    
    if (!snapshot.empty) {
      console.log("SUCCESS: Read listing data:", snapshot.docs[0].data());
    } else {
      console.log("Collection 'listings' is empty.");
    }

  } catch (error: any) {
    console.error("Direct Firestore Check Failed:", error.message);
  }
}

checkDirectFirestore();
