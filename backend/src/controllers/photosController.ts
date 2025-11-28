import { Request, Response } from "express";
import { catchAsync, AppError } from "../middleware/errorHandler";
import { getStorage } from "firebase-admin/storage";
import prisma from "../config/database";
import logger from "../utils/logger";

/**
 * DELETE /api/v1/photos/:id
 * Remove a photo from Firebase Storage and deletes the DB record
 */
export const deletePhoto = catchAsync(async (req: Request, res: Response) => {
  const photoId = req.params.id;

  if (!photoId) {
    throw new AppError("ID da foto é obrigatório", 400);
  }

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { form: true },
  });

  if (!photo) {
    throw new AppError("Foto não encontrada", 404);
  }

  // Autorização: permitir se for dono do formulário ou role ADMIN/MANAGER/EDITOR
  const user = req.user;
  if (!user) {
    throw new AppError("Não autenticado", 401);
  }

  const allowedRoles = ["ADMIN", "MANAGER", "EDITOR"];
  const isOwner = user.userId === photo.form.userId;
  const isAllowedRole = allowedRoles.includes(user.role);

  if (!isOwner && !isAllowedRole) {
    throw new AppError("Permissão negada para deletar esta foto", 403);
  }

  // Tenta deletar do Firebase Storage
  try {
    const bucket = getStorage().bucket();
    const fileRef = bucket.file(photo.firebasePath);
    await fileRef.delete({ ignoreNotFound: true });
  } catch (err: any) {
    logger.warn("Falha ao deletar arquivo no Storage", { err: err?.message });
    // prosseguir para deletar registro DB mesmo se o arquivo não existir
  }

  // Remover do DB
  await prisma.photo.delete({ where: { id: photoId } });

  // Também remover referência no form.data caso exista
  try {
    const form = await prisma.form.findUnique({ where: { id: photo.formId } });
    if (form) {
      let updated = false;
      const newData = removePhotoFromFormData(
        form.data as any,
        photo.firebaseUrl
      );
      if (JSON.stringify(newData) !== JSON.stringify(form.data)) {
        await prisma.form.update({
          where: { id: form.id },
          data: { data: newData },
        });
        updated = true;
      }
      if (updated) {
        await prisma.auditLog.create({
          data: {
            userId: user.userId,
            action: "FORM_UPDATED",
            entity: "Form",
            entityId: form.id,
            details: { removedPhoto: photo.firebaseUrl },
          },
        });
      }
    }
  } catch (err) {
    // Não interromper o fluxo; registrar aviso
    logger.warn("Falha ao atualizar form.data ao deletar foto", { err });
  }

  // Registrar audit log
  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: "PHOTO_DELETED",
      entity: "Photo",
      entityId: photoId,
      details: { filename: photo.filename, firebasePath: photo.firebasePath },
    },
  });

  res.json({ success: true, message: "Foto removida" });
});

/**
 * DELETE /api/v1/photos?url=
 * Remove file from Firebase Storage by URL. Useful when no DB record exists.
 */
export const deletePhotoByUrl = catchAsync(
  async (req: Request, res: Response) => {
    const url = (req.query.url as string) || (req.body && req.body.url);
    if (!url) {
      throw new AppError(
        "Parâmetro url é obrigatório para deletar por URL",
        400
      );
    }
    // Extrair path do Firebase Storage
    function extractPathFromUrl(urlStr: string) {
      try {
        const urlObj = new URL(urlStr);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
        return pathMatch ? decodeURIComponent(pathMatch[1]) : urlStr;
      } catch {
        return urlStr;
      }
    }

    const firebasePath = extractPathFromUrl(url);

    // Autenticação já foi feita por middleware; apenas tentar deletar
    const bucket = getStorage().bucket();
    try {
      await bucket.file(firebasePath).delete({ ignoreNotFound: true });
    } catch (err: any) {
      // registrar aviso, mas não interromper
      console.warn("Falha ao deletar arquivo por URL:", err.message);
      throw new AppError("Falha ao deletar arquivo no storage", 500);
    }

    // tentar apagar registro no banco, se existir
    try {
      await prisma.photo.deleteMany({ where: { firebasePath } });
    } catch (e: any) {
      // Não interromper; registro pode não existir
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "PHOTO_DELETED_BY_URL",
        entity: "Photo",
        entityId: firebasePath,
        details: { url, firebasePath },
      },
    });

    res.json({ success: true, message: "Arquivo removido (se existia)" });
  }
);

function removePhotoFromFormData(data: any, url: string): any {
  if (Array.isArray(data)) {
    return data
      .map((item) =>
        typeof item === "object" && item
          ? removePhotoFromFormData(item, url)
          : item
      )
      .filter((item) => !(item && item.url === url));
  } else if (typeof data === "object" && data !== null) {
    const newObj: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObj[key] = removePhotoFromFormData(data[key], url);
      }
    }
    return newObj;
  }
  return data;
}

export default { deletePhoto, deletePhotoByUrl };
