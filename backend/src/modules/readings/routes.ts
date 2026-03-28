import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { createIngestController } from "./ingestController";

const router = Router();
const controller = createIngestController();

router.post("/", asyncHandler(controller.ingest));

export { router as ingestRouter };

