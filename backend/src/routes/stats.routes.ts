import { Router } from "express";
import { authenticateFirebase } from "../middleware/auth";
import statsController from "../controllers/stats.controller";

const router = Router();

router.get(
  "/dashboard",
  authenticateFirebase,
  statsController.getDashboardStats
);

export default router;
