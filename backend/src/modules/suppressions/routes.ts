import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../utils/authMiddleware";
import { createSuppressionsController } from "./suppressionsController";

const router = Router();
const controller = createSuppressionsController();

router.get("/", requireAuth, asyncHandler(controller.listSuppressions));
router.post("/", requireAuth, asyncHandler(controller.createSuppression));

export { router as suppressionsRouter };

