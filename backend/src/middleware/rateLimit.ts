import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Rate limiter geral para todas as rotas
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter mais restritivo para operações sensíveis
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 requisições
  message: {
    success: false,
    message: 'Muitas tentativas. Aguarde 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para upload de arquivos
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 uploads por minuto
  message: {
    success: false,
    message: 'Limite de uploads atingido. Aguarde um minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para geração de PDFs
 */
export const pdfLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // 3 PDFs por minuto
  message: {
    success: false,
    message: 'Limite de geração de PDF atingido. Aguarde um minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
