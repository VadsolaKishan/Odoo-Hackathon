import { Request, Response, NextFunction } from "express";
import { TripsService } from "./trips.service";
import { createTripSchema, queryTripSchema, completeTripSchema } from "./trips.schema";
import { createResponse } from "../../shared/response";
import { ValidationError } from "../../shared/errors";

const service = new TripsService();

export class TripsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = queryTripSchema.safeParse(req.query);
      if (!parsed.success) throw new ValidationError("Invalid query", parsed.error.format());
      
      const trips = await service.list(parsed.data);
      res.json(createResponse(trips));
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createTripSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());
      
      const trip = await service.create(parsed.data);
      res.status(201).json(createResponse(trip));
    } catch (err) {
      next(err);
    }
  }

  async dispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await service.dispatch(req.params.id);
      res.json(createResponse(trip));
    } catch (err) {
      next(err);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = completeTripSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError("Invalid payload", parsed.error.format());

      const trip = await service.complete(req.params.id, parsed.data);
      res.json(createResponse(trip));
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await service.cancel(req.params.id);
      res.json(createResponse(trip));
    } catch (err) {
      next(err);
    }
  }
}
