import { Router } from "express";
import { ExpensesController } from "./expenses.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const controller = new ExpensesController();

router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);

export { router as expensesRoutes };
