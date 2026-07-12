import { z } from "zod";

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  serviceType: z.string().trim().min(2).max(100),
  cost: z.coerce.number().min(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  status: z.enum(["Scheduled", "In Progress", "Completed"]).default("Scheduled"),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(["Scheduled", "In Progress", "Completed"]),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
