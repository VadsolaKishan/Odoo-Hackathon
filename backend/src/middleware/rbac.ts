import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../shared/errors";

export type AppModule = "Fleet" | "Drivers" | "Trips" | "Fuel";
export type Perm = "Manage" | "Edit" | "View" | "Read Only" | "—";

const rbac: Record<AppModule, Record<string, Perm>> = {
  Fleet:     { FLEET_MANAGER: "Manage", DISPATCHER: "View",   SAFETY_OFFICER: "View",     FINANCIAL_ANALYST: "Read Only" },
  Drivers:   { FLEET_MANAGER: "Manage", DISPATCHER: "Edit",   SAFETY_OFFICER: "Manage",   FINANCIAL_ANALYST: "Read Only" },
  Trips:     { FLEET_MANAGER: "View",   DISPATCHER: "Manage", SAFETY_OFFICER: "View",     FINANCIAL_ANALYST: "Read Only" },
  Fuel:      { FLEET_MANAGER: "Edit",   DISPATCHER: "Edit",   SAFETY_OFFICER: "Read Only",FINANCIAL_ANALYST: "Manage"   },
};

export const authorizeRole = (module: AppModule) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    const perm = rbac[module][user.role] || "—";
    const method = req.method.toUpperCase();

    // Read Operations
    if (method === "GET") {
      if (perm === "—") {
        return next(new UnauthorizedError("Forbidden: You do not have access to this module."));
      }
      return next();
    }

    // Write Operations (POST, PUT, PATCH, DELETE)
    if (perm === "Manage" || perm === "Edit") {
      return next();
    }

    return next(new UnauthorizedError(`Forbidden: Your role (${user.role}) is restricted to ${perm} for ${module}.`));
  };
};
