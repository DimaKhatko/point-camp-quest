// Server-only Firebase Admin singleton.
//
// This module holds privileged service-account credentials and must NEVER be
// bundled into or imported from client code. The `server-only` marker below
// makes the import-protection plugin fail the build if that ever happens.
import "@tanstack/react-start/server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAdminApp(): App {
  // Initialize exactly once. In dev/HMR the module can be re-evaluated, and
  // calling initializeApp() twice throws — so reuse the existing app if any.
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0]!;
  }

  const projectId = requireEnv("FIREBASE_PROJECT_ID");
  const clientEmail = requireEnv("FIREBASE_CLIENT_EMAIL");
  // Private keys are stored in env vars with escaped "\n" sequences; restore
  // the real newlines before handing the PEM to the SDK.
  const privateKey = requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export const adminApp: App = getAdminApp();

/** Initialized Firestore instance backed by the Admin service account. */
export const db: Firestore = getFirestore(adminApp);
