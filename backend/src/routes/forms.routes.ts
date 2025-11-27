import { Router } from "express";
import {
  createForm,
  getFormById,
  listForms,
  updateForm,
  deleteForm,
  submitForm,
  approveForm,
  generateFormPdf,
} from "../controllers/formsController";
import { authenticateFirebase, authorize } from "../middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation";
import {
  createFormSchema,
  updateFormSchema,
  listFormsSchema,
  idParamSchema,
} from "../validators/formValidators";
import { UserRole } from "@prisma/client";

const router = Router();

/**
 * @route   POST /api/v1/forms
 * @desc    Criar novo formulário
 * @access  Private (ADMIN, MANAGER, EDITOR)
 */
router.post(
  "/",
  authenticateFirebase,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EDITOR),
  validateBody(createFormSchema.shape.body),
  createForm
);

/**
 * @route   GET /api/v1/forms
 * @desc    Listar formulários com filtros
 * @access  Private
 */
router.get(
  "/",
  authenticateFirebase,
  validateQuery(listFormsSchema.shape.query),
  listForms
);

/**
 * @route   GET /api/v1/forms/:id
 * @desc    Buscar formulário por ID
 * @access  Private
 */
router.get(
  "/:id",
  authenticateFirebase,
  validateParams(idParamSchema.shape.params),
  getFormById
);

/**
 * @route   PUT /api/v1/forms/:id
 * @desc    Atualizar formulário
 * @access  Private (ADMIN, MANAGER, EDITOR)
 */
router.put(
  "/:id",
  authenticateFirebase,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EDITOR),
  validateParams(idParamSchema.shape.params),
  validateBody(updateFormSchema.shape.body),
  updateForm
);

/**
 * @route   DELETE /api/v1/forms/:id
 * @desc    Deletar formulário
 * @access  Private (ADMIN, MANAGER)
 */
router.delete(
  "/:id",
  authenticateFirebase,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(idParamSchema.shape.params),
  deleteForm
);

/**
 * @route   POST /api/v1/forms/:id/submit
 * @desc    Submeter formulário para revisão
 * @access  Private (ADMIN, MANAGER, EDITOR)
 */
router.post(
  "/:id/submit",
  authenticateFirebase,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EDITOR),
  validateParams(idParamSchema.shape.params),
  submitForm
);

/**
 * @route   POST /api/v1/forms/:id/approve
 * @desc    Aprovar formulário
 * @access  Private (ADMIN, MANAGER)
 */
router.post(
  "/:id/approve",
  authenticateFirebase,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(idParamSchema.shape.params),
  approveForm
);

/**
 * @route   GET /api/v1/forms/:id/pdf
 * @desc    Gerar e baixar PDF do relatório
 * @access  Private
 */
router.get(
  "/:id/pdf",
  authenticateFirebase,
  validateParams(idParamSchema.shape.params),
  generateFormPdf
);

export default router;
