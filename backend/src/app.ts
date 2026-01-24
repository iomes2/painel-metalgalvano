import express, { Application, Request, Response } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import statusMonitor from "express-status-monitor";
import { config, validateConfig } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimit";
import { sanitizeInput } from "./middleware/validation";
import logger from "./utils/logger";

// Rotas
import formsRoutes from "./routes/forms.routes";
import usersRoutes from "./routes/users.routes";
import gerentesRoutes from "./routes/gerentes.routes";
import timelineRoutes from "./routes/timeline.routes";
import notificationRoutes from "./routes/notification.routes";
import exportRoutes from "./routes/export.routes";
import statsRoutes from "./routes/stats.routes";
import relatoriosRoutes from "./routes/relatorios.routes";
import ordensServicoRoutes from "./routes/ordensServico.routes";
import uploadRoutes from "./routes/upload.routes";
import photosRoutes from "./routes/photos.routes";

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

// Monitoramento
app.use(statusMonitor());

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
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

// Rota de Cobertura de Testes (Apenas em Dev/Test ou protegida)
app.use("/coverage", express.static(path.join(__dirname, "../coverage")));

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
app.use(`${apiPrefix}/relatorios`, relatoriosRoutes);
app.use(`${apiPrefix}/ordens-servico`, ordensServicoRoutes);
app.use(`${apiPrefix}/upload`, uploadRoutes);
app.use(`${apiPrefix}/photos`, photosRoutes);
app.use(`${apiPrefix}/timeline`, timelineRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/export`, exportRoutes);
app.use(`${apiPrefix}/stats`, statsRoutes);

// ==================== ERROR HANDLING ====================

// Rota não encontrada
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

export default app;
