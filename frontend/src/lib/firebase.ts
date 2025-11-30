
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; // Adicionado para obter o Firestore

// Acessando as variáveis de ambiente do Next.js
// Elas DEVEM começar com NEXT_PUBLIC_ para serem acessíveis no cliente.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validação para garantir que todas as chaves necessárias estão presentes
const requiredEnvVars: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingEnvVars = requiredEnvVars.filter(key => !firebaseConfig[key]);

// Initialize Firebase variables
let app: any;
let auth: any;
let storage: any;
let db: any;

if (missingEnvVars.length > 0) {
  const message = `As seguintes variáveis de ambiente do Firebase não foram definidas:\n${missingEnvVars.map(key => `NEXT_PUBLIC_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`).join('\n')}`;
  
  if (typeof window === 'undefined') {
    console.warn("Build time: Firebase config missing. Skipping initialization to allow build to proceed.");
    // Mock objects for build time to prevent crashes
    app = {} as any;
    auth = {} as any;
    storage = {} as any;
    db = {} as any;
  } else {
    console.error(message);
    throw new Error(message);
  }
} else {
  // Initialize Firebase only if config is valid
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  storage = getStorage(app);
  db = getFirestore(app);

  // Configurar persistência do Firebase Auth para usar localStorage
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Erro ao configurar persistência do Firebase Auth:", error);
    });
  }
}

export { app, auth, storage, db, firebaseConfig };
