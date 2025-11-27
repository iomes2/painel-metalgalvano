
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

if (missingEnvVars.length > 0) {
  const message = `As seguintes variáveis de ambiente do Firebase não foram definidas no seu arquivo .env.local (ou similar):\n${missingEnvVars.map(key => `NEXT_PUBLIC_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`).join('\n')}\n\nPor favor, adicione-as para continuar. Veja src/lib/firebase.ts para mais detalhes.`;
  if (typeof window !== 'undefined') {
    // No cliente, podemos mostrar um alerta ou logar no console
    console.error(message);
    // Você pode querer lançar um erro aqui ou ter um UI de fallback
    // throw new Error(message); // Descomente se quiser que o app quebre explicitamente
  } else {
    // No servidor, logar e possivelmente lançar um erro é apropriado
    console.error(message);
    // throw new Error(message); // Descomente se quiser que o build/server start falhe
  }
  // Se não lançarmos um erro, o app pode tentar inicializar com config incompleta.
  // Dependendo da sua estratégia de erro, você pode querer um comportamento diferente aqui.
}


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app); // Inicializando o Firestore

// Configurar persistência do Firebase Auth para usar localStorage
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Erro ao configurar persistência do Firebase Auth:", error);
  });
}

export { app, auth, storage, db, firebaseConfig }; // Exporte db e firebaseConfig se precisar deles em outros lugares
