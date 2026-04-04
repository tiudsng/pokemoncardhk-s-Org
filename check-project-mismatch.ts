import { initializeApp, getApp, getApps } from "firebase-admin/app";
import path from "path";
import fs from "fs";

async function checkProjectMismatch() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    const firebaseApp = getApps().length === 0 
      ? initializeApp() 
      : getApp();

    const envProjectId = firebaseApp.options.projectId;
    const configProjectId = firebaseConfig.projectId;

    console.log("Environment Project ID:", envProjectId);
    console.log("Config Project ID:", configProjectId);

    if (envProjectId !== configProjectId) {
      console.log("WARNING: Project ID mismatch! This is likely a remixed app that needs Firebase setup.");
    } else {
      console.log("Project IDs match.");
    }

  } catch (error: any) {
    console.error("Project Mismatch Check Failed:", error.message);
  }
}

checkProjectMismatch();
