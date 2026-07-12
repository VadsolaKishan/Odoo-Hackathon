import { Router } from "express";
import { FuelLogsController } from "./fuelLogs.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new FuelLogsController();

router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);

export { router as fuelLogsRoutes };
