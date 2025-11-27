import { Router, type IRouter } from "express";
import { getOsByGerente } from "../controllers/ordensServicoController";
import { authenticateFirebase } from "../middleware/auth";

const router: IRouter = Router();

/**
 * @route   GET /api/v1/ordens-servico
 * @desc    Buscar OSs por gerente (compatível com Firebase)
 * @access  Private
 * @query   gerenteId - ID do gerente
 */
router.get("/", authenticateFirebase, getOsByGerente);

export default router;
