import { Request, Response, NextFunction } from "express";
import { ExpensesService } from "./expenses.service";
import { createExpenseSchema } from "./expenses.schema";
import { createResponse } from "../../shared/response";
import { ValidationError } from "../../shared/errors";

const service = new ExpensesService();

export class ExpensesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await service.list();
      res.json(createResponse(records));
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createExpenseSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const record = await service.create(parsed.data);
      res.status(201).json(createResponse(record));
    } catch (err) {
      next(err);
    }
  }
}
