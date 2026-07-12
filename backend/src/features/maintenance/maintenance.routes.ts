import { Router } from "express";
import { MaintenanceController } from "./maintenance.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new MaintenanceController();

router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);
router.put("/:id", controller.update);

export { router as maintenanceRoutes };
