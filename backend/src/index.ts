import app from "./app";
import { config } from "./config";
import logger from "./utils/logger";
import { scheduleBackups } from "./services/backupService";

// ==================== SERVIDOR ====================

const PORT = config.port;
const apiPrefix = `/api/${config.apiVersion}`;

// Iniciar agendamento de backups
scheduleBackups();

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
