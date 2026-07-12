import { Router } from "express";
import { VehiclesController } from "./vehicles.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new VehiclesController();

router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.get);
router.put("/:id", controller.update);

export { router as vehiclesRoutes };
