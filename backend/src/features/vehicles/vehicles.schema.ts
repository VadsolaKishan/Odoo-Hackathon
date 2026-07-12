import { z } from "zod";

export const createVehicleSchema = z.object({
  registration: z.string().trim().min(4, "Required").max(20).toUpperCase(),
  name: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  type: z.enum(["Truck", "Van", "Bus", "Car", "Trailer"]),
  capacity: z.coerce.number().int().min(1),
  odometer: z.coerce.number().int().min(0),
  cost: z.coerce.number().min(0),
  status: z.enum(["Available", "On Trip", "In Shop", "Retired"]).default("Available"),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const queryVehicleSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["Truck", "Van", "Bus", "Car", "Trailer"]).optional(),
  status: z.enum(["Available", "On Trip", "In Shop", "Retired"]).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type QueryVehicleInput = z.infer<typeof queryVehicleSchema>;
