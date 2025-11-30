import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Configuração do Firebase Admin SDK
// Suporta dois modos:
// 1) Credenciais via variáveis de ambiente (FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL / FIREBASE_PROJECT_ID)
// 2) Application Default Credentials (ADC) quando a aplicação roda no GCP (ex: Cloud Run, GKE)
// Dessa forma podemos rodar localmente com as credenciais no .env (ou Secret Manager) e em Cloud Run usar a Service Account atribuída
const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  
  // Tratamento robusto para a chave privada
  let privateKey = privateKeyRaw;

  if (privateKey) {
    // Se estiver entre aspas duplas (comum em env vars), remove
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }

    // Tenta decodificar Base64 se não parecer uma chave PEM padrão
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        try {
            const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
            if (decoded.includes("-----BEGIN PRIVATE KEY-----")) {
                privateKey = decoded;
            }
        } catch (e) {
            // Falha silenciosa
        }
    }

    // Substitui \n literais por quebras de linha reais
    if (privateKey.includes("\\n")) {
        privateKey = privateKey.replace(/\\n/g, "\n");
    }
  }

  // Se todas as variáveis de env estiverem presentes, tentamos inicializar com elas
  if (
    process.env.FIREBASE_PROJECT_ID &&
    privateKey &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    try {
        // Sanitização final: garante que a chave tenha o formato exato esperado
        // Remove headers existentes para reconstruir limpo, se necessário, ou usa como está
        let finalKey = privateKey.trim();
        
        // Se a chave não tiver os headers, adiciona (caso o decode do base64 tenha trazido só o corpo)
        if (!finalKey.includes("-----BEGIN PRIVATE KEY-----")) {
            finalKey = `-----BEGIN PRIVATE KEY-----\n${finalKey}\n-----END PRIVATE KEY-----`;
        }

        return admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: finalKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
    } catch (e) {
        console.warn("Falha ao inicializar Firebase com credenciais explícitas (chave privada). Tentando ADC...", e);
        // Não retorna aqui, deixa cair para o fallback de ADC abaixo
    }
  }

  // Caso contrário (ou se falhar acima), tentamos inicializar com ADC
  // Se não houver storageBucket, apenas inicializa sem atribuir o bucket
  const config = {} as any;
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    config.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }

  try {
    console.log("Inicializando Firebase com Application Default Credentials (ADC)...");
    return admin.initializeApp(config);
  } catch (err) {
    // Mensagem amigável para ambientes locais sem credenciais
    throw new Error(
      `Firebase Admin initialization failed: ${
        err instanceof Error ? err.message : err
      }. Ensure FIREBASE_* environment variables are configured or that the app provides ADC (e.g., run on Cloud Run with a Service Account).`
    );
  }
};

const firebaseApp = initializeFirebaseAdmin();
const auth = admin.auth();
const storage = admin.storage();
const db = admin.firestore();

export { firebaseApp, auth, storage, db };
export default admin;
