import { z } from "zod";

export const createFuelLogSchema = z.object({
  vehicleId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  liters: z.coerce.number().min(0.1),
  pricePerLiter: z.coerce.number().min(0),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
