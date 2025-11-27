import { Router } from "express";
import { uploadFiles } from "../controllers/uploadController";
import { authenticateFirebase } from "../middleware/auth";
import multer from "multer";

const router = Router();

// Configurar multer para armazenar arquivos em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
  },
});

/**
 * @route   POST /api/v1/upload
 * @desc    Upload de arquivos para Firebase Storage
 * @access  Private
 */
router.post("/", authenticateFirebase, upload.array("files", 10), uploadFiles);

export default router;
