import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../utils/authMiddleware";
import { createAlertsController } from "./alertsController";

const router = Router();
const controller = createAlertsController();

router.get("/", requireAuth, asyncHandler(controller.listAlerts));
router.post("/:alertId/ack", requireAuth, asyncHandler(controller.ackAlert));
router.post("/:alertId/resolve", requireAuth, asyncHandler(controller.resolveAlert));

export { router as alertsRouter };

