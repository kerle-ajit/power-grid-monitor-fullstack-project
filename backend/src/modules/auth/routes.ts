import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { createAuthController } from "./authController";
import { requireAuth } from "../../utils/authMiddleware";

const router = Router();
const controller = createAuthController();

router.post("/login", asyncHandler(controller.login));
router.get("/me", requireAuth, asyncHandler(controller.me));

export { router as authRouter };

