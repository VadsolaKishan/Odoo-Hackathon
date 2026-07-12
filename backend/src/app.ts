import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./features/auth/auth.routes";
import { vehiclesRoutes } from "./features/vehicles/vehicles.routes";
import { driversRoutes } from "./features/drivers/drivers.routes";
import { tripsRoutes } from "./features/trips/trips.routes";
import { maintenanceRoutes } from "./features/maintenance/maintenance.routes";
import { fuelLogsRoutes } from "./features/fuelLogs/fuelLogs.routes";
import { expensesRoutes } from "./features/expenses/expenses.routes";
import { settingsRoutes } from "./features/settings/settings.routes";
import { authorizeRole } from "./middleware/rbac";
import { requireAuth } from "./middleware/auth";

const app = express();

app.use(cors());
app.use(express.json());

// Features
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", requireAuth, authorizeRole("Fleet"), vehiclesRoutes);
app.use("/api/drivers", requireAuth, authorizeRole("Drivers"), driversRoutes);
app.use("/api/trips", requireAuth, authorizeRole("Trips"), tripsRoutes);
app.use("/api/maintenance", requireAuth, authorizeRole("Maintenance"), maintenanceRoutes);
app.use("/api/fuel-logs", requireAuth, authorizeRole("Fuel"), fuelLogsRoutes);
app.use("/api/expenses", requireAuth, authorizeRole("Fuel"), expensesRoutes);
app.use("/api/settings", requireAuth, authorizeRole("Settings"), settingsRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
