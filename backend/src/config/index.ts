import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3001", 10),
  apiVersion: process.env.API_VERSION || "v1",

  // Database
  databaseUrl: process.env.DATABASE_URL || "",

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  },

  // Security
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  // Permite múltiplas origens separadas por vírgula em CORS_ORIGIN (ex: "http://localhost:3000,http://localhost:3003")
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : "http://localhost:3000",

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 min
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000", 10),
  },

  // Logs
  logLevel: process.env.LOG_LEVEL || "info",

  // Features
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

// Validar configurações críticas
export const validateConfig = () => {
  const requiredVars = [
    "DATABASE_URL",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please check your .env file."
    );
  }
};
