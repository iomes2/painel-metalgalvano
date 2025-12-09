import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

/**
 * Classe customizada para erros da aplicação
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de tratamento de erros global
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error("Erro capturado:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Erro customizado da aplicação
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Erro de validação Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Erro de validação",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Erro do Prisma - Violação de constraint única
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "Registro duplicado",
        field: (err.meta?.target as string[]) || [],
      });
      return;
    }

    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Registro não encontrado",
      });
      return;
    }

    if (err.code === "P2003") {
      res.status(400).json({
        success: false,
        message: "Violação de chave estrangeira",
      });
      return;
    }
  }

  // Erro do Prisma - Erro de validação
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: "Erro de validação de dados",
    });
    return;
  }

  // Erro genérico
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Erro interno do servidor"
        : err.message,
  });
};

/**
 * Middleware para rotas não encontradas
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.url} não encontrada`,
  });
};

/**
 * Wrapper async para capturar erros de promises
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};
