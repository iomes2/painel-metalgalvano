import { Request, Response, NextFunction } from "express";
import { getOsByGerente } from "../../controllers/ordensServicoController";
import prisma from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

// Mocks
jest.mock("../../config/database", () => ({
  __esModule: true,
  default: {
    form: {
      findMany: jest.fn(),
    },
  },
}));

describe("OrdensServicoController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getOsByGerente", () => {
    it("should return list of OS grouped by most recent report", async () => {
      req.query = { gerenteId: "gerente1" };

      const mockForms = [
        {
          osNumber: "OS-001",
          submittedAt: new Date("2023-01-01T10:00:00Z"),
          createdAt: new Date("2023-01-01T10:00:00Z"),
        },
        {
          osNumber: "OS-001",
          submittedAt: new Date("2023-01-02T10:00:00Z"), // Newer
          createdAt: new Date("2023-01-02T10:00:00Z"),
        },
        {
          osNumber: "OS-002",
          submittedAt: new Date("2023-01-01T12:00:00Z"),
          createdAt: new Date("2023-01-01T12:00:00Z"),
        },
      ];

      (prisma.form.findMany as jest.Mock).mockResolvedValue(mockForms);

      await getOsByGerente(req as Request, res as Response, next);

      expect(prisma.form.findMany).toHaveBeenCalledWith({
        where: {
          user: {
            email: {
              startsWith: "gerente1",
              mode: "insensitive",
            },
          },
        },
        select: expect.any(Object),
        orderBy: expect.any(Object),
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: "OS-001",
            os: "OS-001",
            lastReportAt: new Date("2023-01-02T10:00:00Z"),
          },
          {
            id: "OS-002",
            os: "OS-002",
            lastReportAt: new Date("2023-01-01T12:00:00Z"),
          },
        ],
      });
    });

    it("should throw error if gerenteId is missing", async () => {
      req.query = {}; // missing gerenteId

      await getOsByGerente(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Parâmetro 'gerenteId' é obrigatório",
          statusCode: 400,
        })
      );
    });

    it("should handle mixed submittedAt and createdAt dates", async () => {
      req.query = { gerenteId: "gerente1" };

      const mockForms = [
        {
          osNumber: "OS-003",
          submittedAt: null,
          createdAt: new Date("2023-01-05T10:00:00Z"),
        },
      ];
      (prisma.form.findMany as jest.Mock).mockResolvedValue(mockForms);

      await getOsByGerente(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({
            os: "OS-003",
            lastReportAt: new Date("2023-01-05T10:00:00Z"),
          }),
        ],
      });
    });

    it("should return empty list if no forms found", async () => {
      req.query = { gerenteId: "unknown" };
      (prisma.form.findMany as jest.Mock).mockResolvedValue([]);

      await getOsByGerente(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });
});
