import { z } from "zod";
import { FormStatus } from "@prisma/client";

/**
 * Schema de validação para criação de formulário
 */
export const createFormSchema = z.object({
  body: z.object({
    formType: z.string().min(1, "Tipo de formulário é obrigatório"),
    osNumber: z.string().min(1, "Número da OS é obrigatório"),
    data: z.record(z.any()),
  }),
});

/**
 * Schema de validação para atualização de formulário
 */
export const updateFormSchema = z.object({
  body: z.object({
    formType: z.string().optional(),
    osNumber: z.string().optional(),
    data: z.record(z.any()).optional(),
    status: z.nativeEnum(FormStatus).optional(),
  }),
});

/**
 * Schema de validação para busca de formulários
 */
export const listFormsSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    formType: z.string().optional(),
    osNumber: z.string().optional(),
    status: z.nativeEnum(FormStatus).optional(),
    userId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

/**
 * Schema para params com ID
 * Aceita tanto UUID quanto IDs do Firebase (strings alfanuméricas)
 */
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID é obrigatório"),
  }),
});

/**
 * Schema para upload de fotos
 */
export const uploadPhotoSchema = z.object({
  body: z.object({
    formId: z.string().uuid("ID do formulário inválido"),
    firebaseUrl: z.string().url("URL inválida"),
    firebasePath: z.string().min(1, "Caminho do Firebase é obrigatório"),
    filename: z.string().min(1, "Nome do arquivo é obrigatório"),
    originalName: z.string().min(1, "Nome original é obrigatório"),
    mimeType: z.string().min(1, "Tipo MIME é obrigatório"),
    size: z.number().positive("Tamanho deve ser positivo"),
    description: z.string().optional(),
    fieldId: z.string().optional(),
  }),
});

/**
 * Schema para criar relatório vinculado
 */
export const createLinkedReportSchema = z.object({
  body: z.object({
    parentFormId: z.string().uuid("ID do formulário pai inválido"),
    childFormType: z.string().min(1, "Tipo de formulário filho é obrigatório"),
    childFormId: z.string().uuid().optional(),
  }),
});
