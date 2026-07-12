import { Request, Response, NextFunction } from "express";
import { DriversService } from "./drivers.service";
import { createDriverSchema, queryDriverSchema, updateDriverSchema } from "./drivers.schema";
import { createResponse } from "../../shared/response";
import { ValidationError } from "../../shared/errors";

const service = new DriversService();

export class DriversController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = queryDriverSchema.safeParse(req.query);
      if (!parsed.success) throw new ValidationError("Invalid query", parsed.error.format());
      
      const drivers = await service.list(parsed.data);
      res.json(createResponse(drivers));
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await service.getById(req.params.id);
      res.json(createResponse(driver));
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createDriverSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const driver = await service.create(parsed.data);
      res.status(201).json(createResponse(driver));
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateDriverSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const driver = await service.update(req.params.id, parsed.data);
      res.json(createResponse(driver));
    } catch (err) {
      next(err);
    }
  }
}
