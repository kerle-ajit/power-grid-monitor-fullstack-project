import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../utils/authMiddleware";
import { createSensorsController } from "./sensorsController";

const router = Router();
const controller = createSensorsController();

router.get("/sensors", requireAuth, asyncHandler(controller.listSensors));
router.get("/sensors/:id/history", requireAuth, asyncHandler(controller.history));

export { router as sensorsRouter };

