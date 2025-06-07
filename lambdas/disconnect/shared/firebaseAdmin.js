// shared/firebaseAdmin.js
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}");

initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore();
