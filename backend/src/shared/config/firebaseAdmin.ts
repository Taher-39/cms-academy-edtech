import { initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must be set"
    );
  }

  return { projectId, clientEmail, privateKey };
}

let _adminApp: App | null = null;

function getAdminApp(): App {
  if (_adminApp) return _adminApp;

  const sa = getServiceAccount();

  _adminApp = initializeApp({
    credential: cert({
      projectId: sa.projectId,
      clientEmail: sa.clientEmail,
      privateKey: sa.privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return _adminApp;
}

export function getFirebaseAdminAuth() {
  return getAuth(getAdminApp());
}

export async function verifyGoogleIdToken(idToken: string) {
  const auth = getFirebaseAdminAuth();
  const decoded = await auth.verifyIdToken(idToken);
  return decoded;
}
