import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Middleware genérico de validação com Zod
 */
export const validate = (schema: ZodSchema) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validação específica do body
 */
export const validateBody = (schema: ZodSchema) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validação específica dos query params
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validação específica dos params
 */
export const validateParams = (schema: ZodSchema) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para sanitização de entrada
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Remove campos potencialmente perigosos
  const dangerousFields = ["__proto__", "constructor", "prototype"];

  const sanitize = (obj: any): any => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (dangerousFields.includes(key)) {
          delete obj[key];
        } else if (typeof obj[key] === "object") {
          sanitize(obj[key]);
        }
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};
