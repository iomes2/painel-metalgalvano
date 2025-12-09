import { Router } from "express";
import { authenticateFirebase } from "../middleware/auth";
import exportController from "../controllers/export.controller";

const router = Router();

router.get("/forms", authenticateFirebase, exportController.exportForms);

export default router;
