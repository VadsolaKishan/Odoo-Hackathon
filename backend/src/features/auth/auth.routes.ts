import { Router } from "express";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new AuthController();

router.post("/login", controller.login);
router.get("/me", requireAuth, controller.me);

export { router as authRoutes };
