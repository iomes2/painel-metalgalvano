import { Request, Response } from "express";
import { listGerentes } from "../../controllers/gerentesController";
import prisma from "../../config/database";

// Mocks
jest.mock("../../config/database", () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
    },
  },
}));

describe("GerentesController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
    jest.clearAllMocks();
  });

  describe("listGerentes", () => {
    it("should return a list of managers from database", async () => {
      const mockUsers = [
        { id: "1", name: "User One", email: "user1@example.com" },
        { id: "2", name: "", email: "user2@example.com" },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      await listGerentes(req as Request, res as Response, () => {});

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: ["MANAGER", "ADMIN"] } },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { id: "user1", nome: "User One" },
          { id: "user2", nome: "user2@example.com" }, // Fallback to email if name empty
        ],
      });
    });

    it("should handle ID collisions by appending counter", async () => {
      const mockUsers = [
        { id: "1", name: "User One", email: "john@example.com" },
        { id: "2", name: "User Two", email: "john@example.com" }, // Duplicate base ID
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      await listGerentes(req as Request, res as Response, () => {});

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { id: "john", nome: "User One" },
          { id: "john-1", nome: "User Two" },
        ],
      });
    });

    it("should return mock data if database fails", async () => {
      (prisma.user.findMany as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await listGerentes(req as Request, res as Response, () => {});

      expect(consoleSpy).toHaveBeenCalledWith(
        "Banco não configurado, retornando dados mock"
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: "joao.silva" }),
        ]),
      });

      consoleSpy.mockRestore();
    });
  });
});
