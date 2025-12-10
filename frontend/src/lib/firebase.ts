import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseOptions,
} from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";

// Acessando as variáveis de ambiente do Next.js
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validação para garantir que todas as chaves necessárias estão presentes
const requiredEnvVars: (keyof FirebaseOptions)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];
const missingEnvVars = requiredEnvVars.filter((key) => !firebaseConfig[key]);

let appInstance: any = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;
let dbInstance: Firestore | null = null;

if (missingEnvVars.length > 0) {
  const missingKeys = missingEnvVars
    .map((key) => `NEXT_PUBLIC_${key.toUpperCase().replace(/([A-Z])/g, "_$1")}`)
    .join("\n");
  const message = `As seguintes variáveis de ambiente do Firebase não foram definidas:\n${missingKeys}`;

  if (typeof window === "undefined") {
    console.warn("Build time: Firebase config missing. Init skipped.");
    // No-op for build time
  } else {
    console.error(message);
    throw new Error(message);
  }
} else {
  // Initialize Firebase only if config is valid
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(appInstance);
  storageInstance = getStorage(appInstance);
  dbInstance = getFirestore(appInstance);

  // Configurar persistência do Firebase Auth para usar localStorage
  if (typeof window !== "undefined" && authInstance) {
    // S7785: Top-level await is not always clear, keeping catch but formatted
    setPersistence(authInstance, browserLocalPersistence).catch((error) => {
      console.error("Erro ao configurar persistência do Firebase Auth:", error);
    });
  }
}

// Export CONSTANTS (fixing S6861)
const app = appInstance;
const auth = authInstance as Auth;
const storage = storageInstance as FirebaseStorage;
const db = dbInstance as Firestore;

export { app, auth, storage, db, firebaseConfig };
