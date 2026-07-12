import { Request, Response, NextFunction } from "express";
import { SettingsService } from "./settings.service";
import { updateSettingsSchema } from "./settings.schema";
import { createResponse } from "../../shared/response";
import { ValidationError } from "../../shared/errors";

const service = new SettingsService();

export class SettingsController {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await service.get();
      res.json(createResponse(record));
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const record = await service.update(parsed.data);
      res.json(createResponse(record));
    } catch (err) {
      next(err);
    }
  }
}
