import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Configuração do Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !privateKey ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    throw new Error(
      "Firebase Admin SDK credentials are missing. Check your .env file."
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
};

const firebaseApp = initializeFirebaseAdmin();
const auth = admin.auth();
const storage = admin.storage();
const db = admin.firestore();

export { firebaseApp, auth, storage, db };
export default admin;
