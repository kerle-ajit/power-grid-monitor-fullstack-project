import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../utils/authMiddleware";
import { requireSupervisor } from "../../utils/roleMiddleware";
import { createEscalationsController } from "./escalationsController";

const router = Router();
const controller = createEscalationsController();

router.get("/", requireAuth, requireSupervisor, asyncHandler(controller.list));

export { router as escalationsRouter };
