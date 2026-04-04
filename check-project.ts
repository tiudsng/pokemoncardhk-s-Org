import { getApps } from "firebase-admin/app";
import { getApp } from "firebase-admin/app";
import { initializeApp } from "firebase-admin/app";
import path from "path";
import fs from "fs";

async function checkProject() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    const firebaseApp = getApps().length === 0 
      ? initializeApp({ projectId: firebaseConfig.projectId }) 
      : getApp();

    console.log("Project ID from config:", firebaseConfig.projectId);
    console.log("Project ID from initialized app:", firebaseApp.options.projectId);
  } catch (error: any) {
    console.error("Check Failed:", error.message);
  }
}

checkProject();
