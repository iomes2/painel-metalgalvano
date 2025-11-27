import { Router } from "express";
import { listGerentes } from "../controllers/gerentesController";
import { authenticateFirebase } from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/v1/gerentes
 * @desc    Listar gerentes cadastrados
 * @access  Private
 */
router.get("/", authenticateFirebase, listGerentes);

export default router;
