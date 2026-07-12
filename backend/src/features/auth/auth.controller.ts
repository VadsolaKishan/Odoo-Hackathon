import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { loginSchema } from "./auth.schema";
import { createResponse } from "../../shared/response";
import { ValidationError } from "../../shared/errors";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid login payload", parsed.error.format());
      }
      
      const result = await authService.login(parsed.data);
      res.json(createResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user is set by auth middleware
      res.json(createResponse({ user: req.user }));
    } catch (err) {
      next(err);
    }
  }
}
