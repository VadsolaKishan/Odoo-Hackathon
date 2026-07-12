import { Request, Response, NextFunction } from "express";
import { MaintenanceService } from "./maintenance.service";
import { createMaintenanceSchema, updateMaintenanceSchema } from "./maintenance.schema";
import { createResponse } from "../../shared/response";
import { ValidationError } from "../../shared/errors";

const service = new MaintenanceService();

export class MaintenanceController {
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
      const parsed = createMaintenanceSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const record = await service.create(parsed.data);
      res.status(201).json(createResponse(record));
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateMaintenanceSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const record = await service.updateStatus(req.params.id, parsed.data);
      res.json(createResponse(record));
    } catch (err) {
      next(err);
    }
  }
}
