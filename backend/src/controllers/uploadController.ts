import { Request, Response } from "express";
import { catchAsync } from "../middleware/errorHandler";
import { AppError } from "../middleware/errorHandler";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import * as path from "path";

// Inicializar Firebase Admin (se ainda não foi inicializado)
if (getApps().length === 0) {
  const serviceAccountPath = path.resolve(
    __dirname,
    "../../metalgalvano-88706-firebase-adminsdk-fbsvc-f3e15f9fbb.json"
  );
  initializeApp({
    credential: cert(serviceAccountPath),
    storageBucket: "metalgalvano-88706.firebasestorage.app",
  });
}

/**
 * Controller para upload de arquivos
 * Mantém compatibilidade com Firebase Storage
 */
export const uploadFiles = catchAsync(async (req: Request, res: Response) => {
  const files = (req as any).files as any[];

  if (!files || files.length === 0) {
    throw new AppError("Nenhum arquivo foi enviado", 400);
  }

  const { userId, formType, osNumber, timestamp } = req.body;

  if (!userId || !formType || !timestamp) {
    throw new AppError(
      "Parâmetros obrigatórios: userId, formType, timestamp",
      400
    );
  }

  const bucket = getStorage().bucket();
  const uploadedFiles: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }> = [];

  // Upload cada arquivo para Firebase Storage
  for (const file of files) {
    const filePath = `reports/${userId}/${formType}/${
      osNumber || "general"
    }/${timestamp}/${file.originalname}`;
    const fileRef = bucket.file(filePath);

    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Tornar o arquivo público
    await fileRef.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    uploadedFiles.push({
      name: file.originalname,
      url: publicUrl,
      type: file.mimetype,
      size: file.size,
    });
  }

  res.json({
    success: true,
    data: uploadedFiles,
  });
});
