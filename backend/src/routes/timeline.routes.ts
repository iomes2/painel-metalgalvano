import { Router } from "express";
import { authenticateFirebase } from "../middleware/auth";
import timelineController from "../controllers/timeline.controller";

const router = Router();

router.get(
  "/:osNumber",
  authenticateFirebase,
  timelineController.getTimelineByOs
);

export default router;
