import { Request, Response } from "express";
import { FormService } from "../services/formService";
import { catchAsync } from "../middleware/errorHandler";
import { FormStatus } from "@prisma/client";
import pdfService from "../services/pdfService";
import { getFormDefinition } from "../config/forms";
import { AppError } from "../middleware/errorHandler";
import { db } from "../config/firebase";
import admin from "firebase-admin";
import prisma from "../config/database";

const formService = new FormService();

/**
 * Controller para criar formulário
 * Compatível com Firebase: aceita payload de submissão de relatório
 */
export const createForm = catchAsync(async (req: Request, res: Response) => {
  const { formType, formData, osNumber } = req.body;

  const userId = req.user!.userId;

  // Criar formulário no PostgreSQL
  const form = await formService.createForm({
    formType,
    osNumber: osNumber || (formData?.ordemServico as string),
    data: formData,
    userId,
  });

  // Também gravar no Firestore (redundância).
  try {
    const { submittedBy, submittedAt, gerenteId, originatingFormId } = req.body;
    const formDefinition = getFormDefinition(formType);

    // Atualizar documento da OS
    const osDocRef = db.collection("ordens_servico").doc(form.osNumber);
    await osDocRef.set(
      {
        lastReportAt: admin.firestore.Timestamp.fromMillis(
          submittedAt || Date.now()
        ),
        os: form.osNumber,
        updatedBy: submittedBy || req.user!.email,
        updatedByGerenteId: gerenteId || req.user!.email?.split("@")[0],
      },
      { merge: true }
    );

    // Adicionar relatório na subcoleção
    const reportPayload = {
      formType,
      formName: formDefinition?.name || "Formulário",
      formData,
      submittedBy: submittedBy || req.user!.email,
      submittedAt: admin.firestore.Timestamp.fromMillis(
        submittedAt || Date.now()
      ),
      gerenteId: gerenteId || req.user!.email?.split("@")[0],
      ...(originatingFormId && { originatingFormId }),
    };

    await db
      .collection("ordens_servico")
      .doc(form.osNumber)
      .collection("relatorios")
      .doc(form.id)
      .set(reportPayload);
  } catch (firestoreError) {
    console.error("Erro ao gravar no Firestore (não crítico):", firestoreError);
  }

  res.status(201).json({
    success: true,
    message: "Formulário criado com sucesso",
    data: {
      reportId: form.id,
      osId: form.osNumber,
    },
  });
});

/**
 * Controller para buscar formulário por ID
 * Compatível com Firebase: suporta query param ?os para validação
 */
export const getFormById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { os } = req.query;

  const form = await formService.getFormById(id);

  // Validar se a OS corresponde (compatibilidade Firebase)
  if (os && form.osNumber !== os) {
    throw new AppError("Relatório não pertence à OS especificada", 404);
  }

  // Buscar fotos associadas
  const formWithPhotos = await formService.getFormById(id);

  // Extrair gerenteId do email do usuário
  const gerenteId = form.user.email.split("@")[0];

  // Função para normalizar datas
  const normalizeDate = (value: any) => {
    if (!value) return null;

    // Caso 1: Objeto JSON {_seconds, _nanoseconds}
    if (
      typeof value === "object" &&
      value._seconds != null &&
      value._nanoseconds != null
    ) {
      return {
        _seconds: value._seconds,
        _nanoseconds: value._nanoseconds,
      };
    }

    // Caso 2: String ISO
    if (typeof value === "string" && !isNaN(Date.parse(value))) {
      const date = new Date(value);
      return {
        _seconds: Math.floor(date.getTime() / 1000),
        _nanoseconds: (date.getTime() % 1000) * 1000000,
      };
    }

    return null;
  };

  // Converter campos de data do formData
  const formDefinition = getFormDefinition(form.formType);
  const formDataConverted: any = JSON.parse(JSON.stringify(form.data));

  if (formDefinition) {
    formDefinition.fields.forEach((field: any) => {
      if (field.type === "date" && formDataConverted[field.id]) {
        const normalized = normalizeDate(formDataConverted[field.id]);
        if (normalized) {
          formDataConverted[field.id] = normalized;
        }
      }
    });
  }

  // Formatar resposta compatível com Firebase
  const reportData = {
    id: form.id,
    formName:
      getFormDefinition(form.formType)?.name || "Formulário Desconhecido",
    formType: form.formType,
    submittedAt: form.submittedAt || form.createdAt,
    formData: formDataConverted,
    photoUrls: formWithPhotos.photos.map((photo) => ({
      id: photo.id,
      name: photo.originalName,
      url: photo.firebaseUrl,
      type: photo.mimeType,
      size: photo.size,
    })),
    submittedBy: form.user.name,
    gerenteId,
    originatingFormId: form.id,
  };

  res.json({
    success: true,
    data: reportData,
  });
});

/**
 * Controller para listar formulários
 */
export const listForms = catchAsync(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    formType,
    osNumber,
    status,
    userId,
    startDate,
    endDate,
  } = req.query;

  // Resolver userId se não for UUID (busca por username/email prefix)
  let userIds: string | string[] | undefined = userId as string | undefined;

  if (userIds && typeof userIds === "string") {
    // Regex para validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(userIds)) {
      // Se não for UUID, assume que é username (email prefix)
      // Ex: "mg01" busca users com email começando com "mg01@"
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { startsWith: `${userIds}@` } },
            { email: userIds }, // Match exato caso passem email completo
          ],
        },
        select: { id: true },
      });

      if (users.length > 0) {
        userIds = users.map((u) => u.id);
      } else {
        // Se não encontrou usuário, define um UUID inválido ou array vazio para não retornar nada
        // Ou deixa passar string original (que não vai achar forms)
        // Optamos por garantir que não retorne nada se o usuário não existe
        userIds = ["00000000-0000-0000-0000-000000000000"];
      }
    }
  }

  const result = await formService.listForms({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    formType: formType as string | undefined,
    osNumber: osNumber as string | undefined,
    status: status as FormStatus | undefined,
    userId: userIds,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });

  res.json({
    success: true,
    data: result.forms,
    pagination: result.pagination,
  });
});

/**
 * Controller para atualizar formulário
 */
export const updateForm = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const form = await formService.updateForm(id, req.body, userId);

  res.json({
    success: true,
    message: "Formulário atualizado com sucesso",
    data: form,
  });
});

/**
 * Controller para deletar formulário
 */
export const deleteForm = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  await formService.deleteForm(id, userId);

  res.json({
    success: true,
    message: "Formulário deletado com sucesso",
  });
});

/**
 * Controller para submeter formulário
 */
export const submitForm = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const form = await formService.submitForm(id, userId);

  res.json({
    success: true,
    message: "Formulário submetido com sucesso",
    data: form,
  });
});

/**
 * Controller para aprovar formulário
 */
export const approveForm = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const form = await formService.approveForm(id, userId);

  res.json({
    success: true,
    message: "Formulário aprovado com sucesso",
    data: form,
  });
});

/**
 * Controller para gerar PDF do relatório
 */
export const generateFormPdf = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Buscar o formulário
    const form = await formService.getFormById(id);

    if (!form) {
      throw new AppError("Formulário não encontrado", 404);
    }

    // Buscar definição do formulário
    const formDefinition = getFormDefinition(form.formType);

    if (!formDefinition) {
      throw new AppError(
        `Definição do formulário tipo "${form.formType}" não encontrada`,
        404
      );
    }

    // Preparar dados para o PDF
    const reportData = {
      id: form.id,
      formType: form.formType,
      formName: formDefinition.name,
      formData: form.data as Record<string, any>,
      submittedAt: form.submittedAt || form.createdAt,
      submittedBy: form.userId,
      gerenteId: form.user?.email?.split("@")[0] || "desconhecido",
    };

    const osData = {
      osNumber: form.osNumber,
      lastReportAt: form.submittedAt || form.createdAt,
    };

    // Gerar PDF
    const pdfBuffer = await pdfService.generateReportPdf(
      reportData,
      formDefinition,
      osData
    );

    // Configurar headers para download
    const filename = `relatorio-${form.formType}-${form.osNumber}-${form.id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    // Enviar PDF
    res.send(pdfBuffer);
  }
);

/**
 * Controller para buscar relatórios por OS
 * Compatível com formato do Firebase para migração gradual
 */
export const getRelatoriosByOs = catchAsync(
  async (req: Request, res: Response) => {
    const { os } = req.query;

    if (!os) {
      throw new AppError("Parâmetro 'os' é obrigatório", 400);
    }

    const forms = await formService.listForms({
      osNumber: os as string,
      limit: 100, // Limite razoável
    });

    // Transformar para formato compatível com Firebase
    const relatorios = forms.forms.map((form) => ({
      id: form.id,
      formName: getFormDefinition(form.formType)?.name || form.formType,
      formType: form.formType,
      submittedAt: form.submittedAt || form.createdAt,
      formData: form.data,
      photoUrls: form.photos?.map((photo) => ({
        name: photo.originalName,
        url: photo.firebaseUrl,
        type: photo.mimeType,
        size: photo.size,
      })),
      submittedBy: form.userId,
      gerenteId: form.user?.email?.split("@")[0],
    }));

    res.json({
      success: true,
      data: relatorios,
    });
  }
);
