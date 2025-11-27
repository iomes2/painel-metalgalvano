import { Router } from "express";
import {
  getRelatoriosByOs,
  getFormById,
  createForm,
} from "../controllers/formsController";
import { authenticateFirebase } from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/v1/relatorios
 * @desc    Buscar relatórios por OS (compatível com Firebase)
 * @access  Private
 * @query   os - Número da Ordem de Serviço
 */
router.get("/", authenticateFirebase, getRelatoriosByOs);

/**
 * @route   GET /api/v1/relatorios/:id
 * @desc    Buscar relatório individual por ID
 * @access  Private
 * @query   os - (Opcional) Número da OS para validação
 */
router.get("/:id", authenticateFirebase, getFormById);

/**
 * @route   POST /api/v1/relatorios
 * @desc    Criar novo relatório (compatível com Firebase)
 * @access  Private
 */
router.post("/", authenticateFirebase, createForm);

export default router;
