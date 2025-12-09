import { Request, Response, NextFunction } from "express";
import { authenticateFirebase, authorize } from "../../middleware/auth";
import { auth } from "../../config/firebase";
import prisma from "../../config/database";

// Mocks
jest.mock("../../config/firebase", () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

jest.mock("../../config/database", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("Auth Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Partial<Response>;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("authenticateFirebase", () => {
    it("should return 401 if no authorization header", async () => {
      await authenticateFirebase(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token de autenticação não fornecido",
        })
      );
    });

    it("should return 401 if header does not start with Bearer", async () => {
      req.headers = { authorization: "Basic 123" };
      await authenticateFirebase(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 401 if verifyIdToken throws", async () => {
      req.headers = { authorization: "Bearer invalid-token" };
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error("Invalid token")
      );

      await authenticateFirebase(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid token" })
      );
    });

    it("should create new user if not found and has email", async () => {
      req.headers = { authorization: "Bearer token" };
      const decodedUser = { uid: "firebase-uid", email: "new@example.com" };
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(decodedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "new-id",
        firebaseUid: "firebase-uid",
        email: "new@example.com",
        role: "MANAGER",
        isActive: true,
      });

      await authenticateFirebase(req as Request, res as Response, next);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.email).toBe("new@example.com");
      expect(next).toHaveBeenCalled();
    });

    it("should authenticate existing user", async () => {
      req.headers = { authorization: "Bearer token" };
      const decodedUser = {
        uid: "firebase-uid",
        email: "existing@example.com",
      };
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(decodedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-id",
        firebaseUid: "firebase-uid",
        email: "existing@example.com",
        role: "MANAGER",
        isActive: true,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await authenticateFirebase(req as Request, res as Response, next);

      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe("user-id");
      expect(next).toHaveBeenCalled();
    });

    it("should return 403 if user is inactive", async () => {
      req.headers = { authorization: "Bearer token" };
      const decodedUser = {
        uid: "firebase-uid",
        email: "inactive@example.com",
      };
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(decodedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        isActive: false,
      });

      await authenticateFirebase(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Usuário inativo" })
      );
    });
  });

  describe("authorize", () => {
    it("should return 401 if user is not attached to request", () => {
      const middleware = authorize("ADMIN");
      middleware(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 403 if user role is not allowed", () => {
      req.user = { role: "MANAGER" } as any;
      const middleware = authorize("ADMIN");
      middleware(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should call next if user role is allowed", () => {
      req.user = { role: "ADMIN" } as any;
      const middleware = authorize("ADMIN", "MANAGER");
      middleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
