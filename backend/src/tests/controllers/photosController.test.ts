import { Request, Response } from "express";
import {
  deletePhoto,
  deletePhotoByUrl,
} from "../../controllers/photosController";
import prisma from "../../config/database";
import { getStorage } from "firebase-admin/storage";
import { AppError } from "../../middleware/errorHandler";

// Mocks
jest.mock("../../config/database", () => ({
  __esModule: true,
  default: {
    photo: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    form: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock("firebase-admin/storage", () => ({
  getStorage: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe("PhotosController", () => {
  let req: Partial<Request> & { user?: any; params: any };
  let res: Partial<Response>;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { userId: "user-1", role: "ADMIN" }, // Default to admin for success path
    } as any;
    res = {
      json: jest.fn(),
    } as unknown as Partial<Response>;

    // Setup Firebase Mocks
    mockFile = {
      delete: jest.fn().mockResolvedValue([{}]),
    };
    mockBucket = {
      file: jest.fn().mockReturnValue(mockFile),
    };
    (getStorage as jest.Mock).mockReturnValue({
      bucket: jest.fn().mockReturnValue(mockBucket),
    });

    jest.clearAllMocks();
  });

  describe("deletePhoto", () => {
    it("should delete photo successfully (Storage + DB + Audit)", async () => {
      req.params.id = "p-1";
      const mockPhoto = {
        id: "p-1",
        firebasePath: "path/to/img",
        firebaseUrl: "http://img",
        formId: "f-1",
        filename: "img.jpg",
      };

      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(mockPhoto);
      (prisma.form.findUnique as jest.Mock).mockResolvedValue(null); // No form update for simplicity here

      await deletePhoto(req as Request, res as Response, jest.fn());

      expect(prisma.photo.findUnique).toHaveBeenCalledWith({
        where: { id: "p-1" },
        include: { form: true },
      });
      expect(mockBucket.file).toHaveBeenCalledWith("path/to/img");
      expect(mockFile.delete).toHaveBeenCalled();
      expect(prisma.photo.delete).toHaveBeenCalledWith({
        where: { id: "p-1" },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled(); // Should create audit log
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Foto removida",
      });
    });

    it("should throw 400 if ID is missing", async () => {
      req.params.id = "";
      const next = jest.fn();

      await deletePhoto(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: "ID da foto é obrigatório" })
      );
    });

    it("should throw 404 if photo not found", async () => {
      req.params.id = "p-99";
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(null);
      const next = jest.fn();

      await deletePhoto(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Foto não encontrada" })
      );
    });

    it("should throw 401 if user not authenticated", async () => {
      req.params.id = "p-1";
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue({ id: "p-1" });
      req.user = undefined;
      const next = jest.fn();

      await deletePhoto(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Não autenticado" })
      );
    });

    it("should throw 403 if user is not ADMIN", async () => {
      req.params.id = "p-1";
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue({ id: "p-1" });
      req.user = { userId: "u-2", role: "MANAGER" };
      const next = jest.fn();

      await deletePhoto(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Apenas administradores podem deletar fotos",
        })
      );
    });

    it("should update form data if photo was present in form", async () => {
      req.params.id = "p-1";
      const mockPhoto = {
        id: "p-1",
        firebasePath: "path",
        firebaseUrl: "http://url",
        formId: "f-1",
        filename: "f.jpg",
      };
      const mockForm = {
        id: "f-1",
        data: {
          photos: [
            { url: "http://url", name: "pic" },
            { url: "http://other", name: "pic2" },
          ],
        },
      };

      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(mockPhoto);
      (prisma.form.findUnique as jest.Mock).mockResolvedValue(mockForm);

      await deletePhoto(req as Request, res as Response, jest.fn());

      expect(prisma.form.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "f-1" },
          data: {
            data: expect.objectContaining({
              photos: [{ url: "http://other", name: "pic2" }],
            }),
          },
        })
      );
    });
  });

  describe("deletePhotoByUrl", () => {
    it("should delete by URL query param", async () => {
      req.query = { url: "http://example.com/o/path%2Fto%2Ffile" };

      await deletePhotoByUrl(req as Request, res as Response, jest.fn());

      expect(mockBucket.file).toHaveBeenCalledWith("path/to/file");
      expect(mockFile.delete).toHaveBeenCalled();
      expect(prisma.photo.deleteMany).toHaveBeenCalledWith({
        where: { firebasePath: "path/to/file" },
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should delete by body url param", async () => {
      req.query = {};
      req.body = { url: "http://simple-url" };

      await deletePhotoByUrl(req as Request, res as Response, jest.fn());

      expect(mockBucket.file).toHaveBeenCalledWith("http://simple-url");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should throw 400 if url missing", async () => {
      req.query = {};
      req.body = {};
      const next = jest.fn();

      await deletePhotoByUrl(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Parâmetro url é obrigatório para deletar por URL",
        })
      );
    });
  });
});
