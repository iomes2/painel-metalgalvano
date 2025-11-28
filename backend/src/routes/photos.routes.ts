import { Router } from "express";
import { authenticateFirebase } from "../middleware/auth";
import photosController from "../controllers/photosController";

const router = Router();

/**
 * @route DELETE /api/v1/photos/:id
 * @access Private
 */
router.delete(
  "/:id",
  authenticateFirebase,
  // allow authenticated users; detailed ownership check inside controller
  photosController.deletePhoto
);

// Deletar por URL (quando não há registro na base)
router.delete("/", authenticateFirebase, photosController.deletePhotoByUrl);

export default router;
