// Server-only Firebase Admin singleton.
//
// This module holds privileged service-account credentials and must NEVER be
// bundled into or imported from client code. The `server-only` marker below
// makes the import-protection plugin fail the build if that ever happens.
import "@tanstack/react-start/server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  // Initialize exactly once. In dev/HMR the module can be re-evaluated, and
  // calling initializeApp() twice throws — so reuse the existing app if any.
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  // Private keys are stored in env vars with escaped "\n" sequences; restore
  // the real newlines before handing the PEM to the SDK.
  const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, "\n") : undefined;

  // One-time init diagnostics — booleans/lengths ONLY, never the key content.
  console.log(
    `[firebase] init env check — projectIdPresent=${!!projectId}, ` +
      `clientEmailPresent=${!!clientEmail}, ` +
      `privateKeyLength=${rawPrivateKey?.length ?? 0}, ` +
      `privateKeyStartsWithBegin=${privateKey?.startsWith("-----BEGIN") ?? false}, ` +
      `privateKeyHasNewline=${privateKey?.includes("\n") ?? false}`,
  );

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && "FIREBASE_PROJECT_ID",
      !clientEmail && "FIREBASE_CLIENT_EMAIL",
      !privateKey && "FIREBASE_PRIVATE_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    const message = `missing required env var(s): ${missing}`;
    console.error(`[firebase] init failed: ${message}`);
    throw new Error(message);
  }

  try {
    // cert() parses the PEM synchronously, so a malformed key throws here.
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } catch (err) {
    // Message only — Firebase's parse errors describe the problem (e.g.
    // "Failed to parse private key") without echoing the key content.
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[firebase] init failed: ${message}`);
    throw err;
  }
}

export const adminApp: App = getAdminApp();

/** Initialized Firestore instance backed by the Admin service account. */
export const db: Firestore = getFirestore(adminApp);
