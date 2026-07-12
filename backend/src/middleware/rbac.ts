import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../shared/errors";

export type AppModule = "Fleet" | "Drivers" | "Trips" | "Maintenance" | "Fuel" | "Settings";
export type Perm = "Manage" | "Edit" | "View" | "Read Only" | "—";

const rbac: Record<AppModule, Record<string, Perm>> = {
  Fleet: {
    FLEET_MANAGER:     "Manage",
    DISPATCHER:        "View",
    SAFETY_OFFICER:    "View",
    FINANCIAL_ANALYST: "Read Only",
  },
  Drivers: {
    FLEET_MANAGER:     "Manage",
    DISPATCHER:        "Edit",
    SAFETY_OFFICER:    "Manage",
    FINANCIAL_ANALYST: "Read Only",
  },
  Trips: {
    FLEET_MANAGER:     "View",
    DISPATCHER:        "Manage",
    SAFETY_OFFICER:    "View",
    FINANCIAL_ANALYST: "Read Only",
  },
  Maintenance: {
    FLEET_MANAGER:     "Manage",
    DISPATCHER:        "Read Only",
    SAFETY_OFFICER:    "Read Only",
    FINANCIAL_ANALYST: "Read Only",
  },
  Fuel: {
    FLEET_MANAGER:     "Edit",
    DISPATCHER:        "Edit",
    SAFETY_OFFICER:    "Read Only",
    FINANCIAL_ANALYST: "Manage",
  },
  Settings: {
    FLEET_MANAGER:     "Manage",
    DISPATCHER:        "Read Only",
    SAFETY_OFFICER:    "Read Only",
    FINANCIAL_ANALYST: "Read Only",
  },
};

export const authorizeRole = (module: AppModule) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    const perm = rbac[module][user.role] || "—";
    const method = req.method.toUpperCase();

    // 1. Check Delete block (Edit/View/Read Only cannot delete)
    if (method === "DELETE") {
      if (perm !== "Manage") {
        return next(
          new UnauthorizedError(
            `Forbidden: Your role (${user.role}) lacks delete permission for ${module} (Manage required).`
          )
        );
      }
      return next();
    }

    // 2. Read Operations
    if (method === "GET") {
      if (perm === "—") {
        return next(
          new UnauthorizedError(`Forbidden: You do not have access to ${module}.`)
        );
      }
      return next();
    }

    // 3. Write Operations (POST, PUT, PATCH)
    if (perm === "Manage" || perm === "Edit") {
      return next();
    }

    return next(
      new UnauthorizedError(
        `Forbidden: Your role (${user.role}) is restricted to ${perm} for ${module}.`
      )
    );
  };
};
