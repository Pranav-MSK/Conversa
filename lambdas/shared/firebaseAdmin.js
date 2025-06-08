// shared/firebaseAdmin.js
import admin from "firebase-admin";

// Parse service account JSON from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}");

// Only initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Export Firestore
export const db = admin.firestore();
// Export Auth (used in connectHandler)
export const auth = admin.auth();
