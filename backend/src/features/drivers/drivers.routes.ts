import { Router } from "express";
import { DriversController } from "./drivers.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new DriversController();

router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.get);
router.put("/:id", controller.update);

export { router as driversRoutes };
