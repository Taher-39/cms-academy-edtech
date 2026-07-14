/*
  Client-side Firebase initialization (Google Sign-In).
  Uses NEXT_PUBLIC_* env vars only. Lazy-initialized to avoid build-time errors.
*/

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _provider: GoogleAuthProvider | null = null;

function initFirebase() {
  if (_app) return;

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const missing = Object.entries(firebaseConfig).filter(([, v]) => !v);
  if (missing.length > 0) {
    console.warn("Firebase env vars missing:", missing.map(([k]) => k).join(", "));
  }

  _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _auth = getAuth(_app);
  _provider = new GoogleAuthProvider();
}

export function getFirebaseAuth(): Auth {
  if (!_auth) initFirebase();
  return _auth!;
}

export function getGoogleProvider(): GoogleAuthProvider {
  if (!_provider) initFirebase();
  return _provider!;
}

// Convenience re-exports for drop-in replacement
export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    return Reflect.get(getFirebaseAuth(), prop);
  },
});

export const googleProvider = new Proxy({} as GoogleAuthProvider, {
  get(_, prop) {
    return Reflect.get(getGoogleProvider(), prop);
  },
});

