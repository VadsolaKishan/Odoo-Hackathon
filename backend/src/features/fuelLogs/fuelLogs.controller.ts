import { Request, Response, NextFunction } from "express";
import { FuelLogsService } from "./fuelLogs.service";
import { createFuelLogSchema } from "./fuelLogs.schema";
import { createResponse } from "../../shared/response";
import { ValidationError } from "../../shared/errors";

const service = new FuelLogsService();

export class FuelLogsController {
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
      const parsed = createFuelLogSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const record = await service.create(parsed.data);
      res.status(201).json(createResponse(record));
    } catch (err) {
      next(err);
    }
  }
}
