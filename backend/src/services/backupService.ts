import cron from "node-cron";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { storage } from "../config/firebase";
import logger from "../utils/logger";
import { format } from "date-fns";
import util from "util";

const execPromise = util.promisify(exec);

// Diretório temporário para armazenar o dump antes do upload
const BACKUP_DIR = path.join(__dirname, "../../temp_backups");

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const performBackup = async () => {
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmm");
  const fileName = `backup-${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  // A URL do banco deve vir do environment
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    logger.error("❌ [Backup] DATABASE_URL não definida. Abortando backup.");
    return;
  }

  logger.info(`⏳ [Backup] Iniciando backup: ${fileName}...`);

  try {
    // 1. Executar pg_dump
    // Importante: pg_dump deve estar instalado no ambiente onde o node roda (container ou máquina local)
    await execPromise(`pg_dump "${dbUrl}" > "${filePath}"`);

    // Verificar se o arquivo foi criado e tem tamanho > 0
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error("Arquivo de backup gerado está vazio.");
    }

    logger.info(
      `✅ [Backup] Dump gerado com sucesso (${(
        stats.size /
        1024 /
        1024
      ).toFixed(2)} MB). Enviando para Firebase...`
    );

    // 2. Upload para Firebase Storage
    // Salva na pasta 'backups/' dentro do bucket
    const bucket = storage.bucket();
    await bucket.upload(filePath, {
      destination: `backups/${fileName}`,
      metadata: {
        contentType: "application/x-sql",
      },
    });

    logger.info(`✅ [Backup] Upload concluído: backups/${fileName}`);

    // 3. Limpeza local
    fs.unlinkSync(filePath);
    logger.info(`🧹 [Backup] Arquivo local removido.`);
  } catch (error) {
    logger.error("❌ [Backup] Erro durante o processo de backup:", error);
    // Tenta limpar arquivo parcial em caso de erro
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

export const scheduleBackups = () => {
  // Configuração padrão: Todo dia às 03:00 AM
  // Formato CRON: min hora dia_mes mes dia_semana
  const schedule = "0 3 * * *";

  logger.info(`🕒 [Backup] Agendando backups automáticos para: ${schedule}`);

  cron.schedule(schedule, () => {
    logger.info("⏱️ [Backup] Executando tarefa agendada...");
    performBackup();
  });
};
