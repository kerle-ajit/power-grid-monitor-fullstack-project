import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../utils/authMiddleware";
import { createRulesController } from "./rulesController";

const router = Router();
const controller = createRulesController();

router.get("/:sensorId", requireAuth, asyncHandler(controller.getRuleConfig));
router.put("/:sensorId", requireAuth, asyncHandler(controller.upsertRuleConfig));

export { router as rulesRouter };

