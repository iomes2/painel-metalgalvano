import { Request, Response, NextFunction } from "express";
import {
  errorHandler,
  notFoundHandler,
  AppError,
} from "../../middleware/errorHandler";
import { ZodError, ZodIssue } from "zod";
import { Prisma } from "@prisma/client";
import logger from "../../utils/logger";

jest.mock("../../utils/logger", () => ({
  error: jest.fn(),
}));

describe("ErrorHandler Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      url: "/test",
      method: "GET",
      ip: "127.0.0.1",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Partial<Response>;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("errorHandler", () => {
    it("should handle AppError", () => {
      const error = new AppError("Custom error", 418);
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Custom error",
      });
    });

    it("should handle ZodError", () => {
      // Create a real ZodError-like structure
      const issue: ZodIssue = {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["field"],
        message: "Invalid input",
      };
      const error = new ZodError([issue]);

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro de validação",
        errors: [{ field: "field", message: "Invalid input" }],
      });
    });

    it("should handle Prisma P2002 (Unique constraint)", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint",
        {
          code: "P2002",
          clientVersion: "1.0",
          meta: { target: ["email"] },
        }
      );

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Registro duplicado",
          field: ["email"],
        })
      );
    });

    it("should handle Prisma P2025 (Record not found)", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "1.0",
      });

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Registro não encontrado" })
      );
    });

    it("should handle Prisma P2003 (Foreign key)", () => {
      const error = new Prisma.PrismaClientKnownRequestError("FK Error", {
        code: "P2003",
        clientVersion: "1.0",
      });

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Violação de chave estrangeira" })
      );
    });

    it("should handle PrismaClientValidationError", () => {
      const error = new Prisma.PrismaClientValidationError(
        "Validation failed",
        {
          clientVersion: "1.0",
        }
      );

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Erro de validação de dados" })
      );
    });

    it("should handle generic Error in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Secret error");
      errorHandler(error, req as Request, res as Response, next);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should handle generic Error in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Visible error");
      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Visible error",
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("notFoundHandler", () => {
    it("should return 404 for unknown routes", () => {
      notFoundHandler(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Rota GET /test não encontrada",
      });
    });
  });
});
