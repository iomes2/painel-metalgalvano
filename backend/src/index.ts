import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import { config, validateConfig } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimit";
import { sanitizeInput } from "./middleware/validation";
import logger from "./utils/logger";

// Rotas
import formsRoutes from "./routes/forms.routes";
import usersRoutes from "./routes/users.routes";
import gerentesRoutes from "./routes/gerentes.routes";

// Carregar variáveis de ambiente
dotenv.config();

// Validar configurações
try {
  validateConfig();
} catch (error) {
  logger.error("Erro de configuração:", error);
  process.exit(1);
}

// Criar aplicação Express
const app: Application = express();

// ==================== MIDDLEWARES ====================

// Segurança
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Compressão
app.use(compression());

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use(generalLimiter);

// Sanitização de entrada
app.use(sanitizeInput);

// Logging de requisições
app.use((req: Request, _res: Response, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// ==================== ROTAS ====================

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API está funcionando corretamente",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Rota raiz
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Painel Metalgalvano API",
    version: config.apiVersion,
    documentation: "/api/docs",
  });
});

// Rotas da API
const apiPrefix = `/api/${config.apiVersion}`;
app.use(`${apiPrefix}/forms`, formsRoutes);
app.use(`${apiPrefix}/users`, usersRoutes);
app.use(`${apiPrefix}/gerentes`, gerentesRoutes);
app.use(
  `${apiPrefix}/relatorios`,
  require("./routes/relatorios.routes").default
);
app.use(
  `${apiPrefix}/ordens-servico`,
  require("./routes/ordensServico.routes").default
);
app.use(`${apiPrefix}/upload`, require("./routes/upload.routes").default);
app.use(`${apiPrefix}/photos`, require("./routes/photos.routes").default);

// ==================== ERROR HANDLING ====================

// Rota não encontrada
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

// ==================== SERVIDOR ====================

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📝 Ambiente: ${config.nodeEnv}`);
  logger.info(`🔗 API: http://localhost:${PORT}${apiPrefix}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM recebido. Encerrando servidor...");
  server.close(() => {
    logger.info("Servidor encerrado");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT recebido. Encerrando servidor...");
  server.close(() => {
    logger.info("Servidor encerrado");
    process.exit(0);
  });
});

// Tratamento de erros não capturados
process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection:", reason);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  server.close(() => process.exit(1));
});

export default app;
