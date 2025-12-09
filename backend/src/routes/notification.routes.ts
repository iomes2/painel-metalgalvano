import { Router } from "express";
import { authenticateFirebase } from "../middleware/auth";
import notificationController from "../controllers/notification.controller";

const router = Router();

router.get("/", authenticateFirebase, notificationController.getNotifications);
router.patch(
  "/:id/read",
  authenticateFirebase,
  notificationController.markAsRead
);
router.patch(
  "/read-all",
  authenticateFirebase,
  notificationController.markAllAsRead
);

export default router;
