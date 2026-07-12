import { Router } from "express";
import { SettingsController } from "./settings.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new SettingsController();

router.use(requireAuth);

router.get("/", controller.get);
router.put("/", controller.update);

export { router as settingsRoutes };
