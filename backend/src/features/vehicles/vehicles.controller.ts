import { Request, Response, NextFunction } from "express";
import { VehiclesService } from "./vehicles.service";
import { createVehicleSchema, queryVehicleSchema, updateVehicleSchema } from "./vehicles.schema";
import { createResponse } from "../../shared/response";
import { ValidationError } from "../../shared/errors";

const service = new VehiclesService();

export class VehiclesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = queryVehicleSchema.safeParse(req.query);
      if (!parsed.success) throw new ValidationError("Invalid query", parsed.error.format());
      
      const vehicles = await service.list(parsed.data);
      res.json(createResponse(vehicles));
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await service.getById(req.params.id);
      res.json(createResponse(vehicle));
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createVehicleSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const vehicle = await service.create(parsed.data);
      res.status(201).json(createResponse(vehicle));
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateVehicleSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const vehicle = await service.update(req.params.id, parsed.data);
      res.json(createResponse(vehicle));
    } catch (err) {
      next(err);
    }
  }
}
