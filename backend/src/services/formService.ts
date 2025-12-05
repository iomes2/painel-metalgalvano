import prisma from "../config/database";
import {
  extractPhotosFromFormData,
  extractPathFromUrl,
} from "../utils/formHelpers";
import { FormStatus, Prisma } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import logger from "../utils/logger";

interface CreateFormData {
  formType: string;
  osNumber: string;
  data: Record<string, any>;
  userId: string;
}

interface UpdateFormData {
  formType?: string;
  osNumber?: string;
  data?: Record<string, any>;
  status?: FormStatus;
}

interface ListFormsParams {
  page?: number;
  limit?: number;
  formType?: string;
  osNumber?: string;
  status?: FormStatus;
  userId?: string | string[];
  startDate?: Date;
  endDate?: Date;
}

export class FormService {
  /**
   * Criar novo formulário
   */
  async createForm(data: CreateFormData) {
    try {
      const form = await prisma.form.create({
        data: {
          formType: data.formType,
          osNumber: data.osNumber,
          data: data.data,
          userId: data.userId,
          status: FormStatus.DRAFT,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log de auditoria
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: "FORM_CREATED",
          entity: "Form",
          entityId: form.id,
          details: { formType: data.formType, osNumber: data.osNumber },
        },
      });

      logger.info(`Formulário criado: ${form.id}`, { formType: data.formType });
      // Se houver fotos no form.data, criar registros Photo vinculados
      try {
        const photos = extractPhotosFromFormData(data.data || {});
        if (photos.length > 0) {
          const photoCreates = photos.map((p) => ({
            formId: form.id,
            firebaseUrl: p.url,
            firebasePath: extractPathFromUrl(p.url),
            filename: p.name || p.originalName || "",
            originalName: p.originalName || p.name || "",
            mimeType: p.type || "image/unknown",
            size: p.size || 0,
            description: "",
            fieldId: p.fieldId,
          }));
          await prisma.photo.createMany({ data: photoCreates });
        }
      } catch (err) {
        logger.warn("Falha ao criar Photo records ao criar Form", err);
      }
      return form;
    } catch (error) {
      logger.error("Erro ao criar formulário:", error);
      throw new AppError("Erro ao criar formulário", 500);
    }
  }

  /**
   * Buscar formulário por ID
   */
  async getFormById(id: string) {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        photos: true,
        linkedReports: true,
      },
    });

    if (!form) {
      throw new AppError("Formulário não encontrado", 404);
    }

    return form;
  }

  /**
   * Listar formulários com filtros e paginação
   */
  async listForms(params: ListFormsParams) {
    const {
      page = 1,
      limit = 10,
      formType,
      osNumber,
      status,
      userId,
      startDate,
      endDate,
    } = params;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.FormWhereInput = {};

    if (formType) where.formType = formType;
    if (osNumber) where.osNumber = { contains: osNumber, mode: "insensitive" };
    if (status) where.status = status;

    if (userId) {
      if (Array.isArray(userId)) {
        where.userId = { in: userId };
      } else {
        where.userId = userId;
      }
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Buscar dados
    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          photos: {
            select: {
              id: true,
              originalName: true,
              firebaseUrl: true,
              mimeType: true,
              size: true,
            },
          },
          _count: {
            select: {
              photos: true,
              linkedReports: true,
            },
          },
        },
      }),
      prisma.form.count({ where }),
    ]);

    return {
      forms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Atualizar formulário
   */
  async updateForm(id: string, data: UpdateFormData, userId: string) {
    // Verificar permissão (usuário só pode editar seus próprios formulários, exceto admins)
    // Essa validação pode ser feita no controller com base na role

    const form = await prisma.form.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: "FORM_UPDATED",
        entity: "Form",
        entityId: id,
        details: data as Prisma.InputJsonValue,
      },
    });

    logger.info(`Formulário atualizado: ${id}`);
    // Criar registros de Photo novos caso form.data possua imagens sem registro
    try {
      const photos = extractPhotosFromFormData(data.data || {});
      if (photos.length > 0) {
        // For each photo item, insert if not already in DB by firebaseUrl
        for (const p of photos) {
          const existing = await prisma.photo
            .findFirst({ where: { firebaseUrl: p.url } as any })
            .catch(() => null);
          if (!existing) {
            await prisma.photo.create({
              data: {
                formId: id,
                firebaseUrl: p.url,
                firebasePath: extractPathFromUrl(p.url),
                filename: p.name || p.originalName || "",
                originalName: p.originalName || p.name || "",
                mimeType: p.type || "image/unknown",
                size: p.size || 0,
                description: "",
                fieldId: p.fieldId,
              },
            });
          }
        }
      }
    } catch (err) {
      logger.warn("Falha ao criar Photo records ao atualizar Form", err);
    }
    return form;
  }

  /**
   * Deletar formulário
   */
  async deleteForm(id: string, userId: string) {
    // Verificar se o formulário existe
    await this.getFormById(id);

    await prisma.form.delete({
      where: { id },
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: "FORM_DELETED",
        entity: "Form",
        entityId: id,
      },
    });

    logger.info(`Formulário deletado: ${id}`);
  }

  /**
   * Submeter formulário para revisão
   */
  async submitForm(id: string, userId: string) {
    const form = await prisma.form.update({
      where: { id },
      data: {
        status: FormStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: "FORM_SUBMITTED",
        entity: "Form",
        entityId: id,
      },
    });

    logger.info(`Formulário submetido: ${id}`);
    return form;
  }

  /**
   * Aprovar formulário
   */
  async approveForm(id: string, userId: string) {
    const form = await prisma.form.update({
      where: { id },
      data: {
        status: FormStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId,
        action: "FORM_APPROVED",
        entity: "Form",
        entityId: id,
      },
    });

    logger.info(`Formulário aprovado: ${id}`);
    return form;
  }
}
