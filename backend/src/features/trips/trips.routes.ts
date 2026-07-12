import { Router } from "express";
import { TripsController } from "./trips.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new TripsController();

router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id/dispatch", controller.dispatch);
router.patch("/:id/complete", controller.complete);
router.patch("/:id/cancel", controller.cancel);

export { router as tripsRoutes };
