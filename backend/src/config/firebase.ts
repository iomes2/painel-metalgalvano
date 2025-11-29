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
  
  console.log("DEBUG: Iniciando processamento da chave privada");
  console.log(`DEBUG: Chave original recebida? ${!!privateKeyRaw}`);
  if (privateKeyRaw) console.log(`DEBUG: Tamanho original: ${privateKeyRaw.length}`);

  if (privateKey) {
    // Se estiver entre aspas duplas (comum em env vars), remove
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      console.log("DEBUG: Removendo aspas duplas externas");
      privateKey = privateKey.slice(1, -1);
    }

    // Tenta decodificar Base64 se não parecer uma chave PEM padrão
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        console.log("DEBUG: Chave não parece PEM, tentando decodificar Base64...");
        try {
            const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
            if (decoded.includes("-----BEGIN PRIVATE KEY-----")) {
                console.log("DEBUG: Sucesso! Base64 decodificado para PEM válido.");
                privateKey = decoded;
            } else {
                console.log("DEBUG: Falha. Decodificação Base64 não resultou em PEM válido.");
                console.log(`DEBUG: Início do conteúdo decodificado: ${decoded.substring(0, 20)}...`);
            }
        } catch (e) {
            console.log("DEBUG: Erro ao tentar decodificar Base64:", e);
        }
    } else {
        console.log("DEBUG: Chave já parece estar em formato PEM (contém header).");
    }

    // Substitui \n literais por quebras de linha reais
    if (privateKey.includes("\\n")) {
        console.log("DEBUG: Substituindo \\n literais por quebras de linha reais.");
        privateKey = privateKey.replace(/\\n/g, "\n");
    }
    
    console.log(`DEBUG: Tamanho final da chave: ${privateKey.length}`);
    console.log(`DEBUG: Início da chave final: ${privateKey.substring(0, 30)}...`);
  }

  // Se todas as variáveis de env estiverem presentes, inicializamos com o JSON do service account
  if (
    process.env.FIREBASE_PROJECT_ID &&
    privateKey &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  // Caso contrário, tentamos inicializar com ADC (quando rodando no GCP todo o infra de credenciais é provido automaticamente)
  // Se não houver storageBucket, apenas inicializa sem atribuir o bucket
  const config = {} as any;
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    config.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }

  try {
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
