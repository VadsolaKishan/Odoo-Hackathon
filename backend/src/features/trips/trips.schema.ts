import { z } from "zod";

export const createTripSchema = z.object({
  source: z.string().trim().min(2).max(80),
  destination: z.string().trim().min(2).max(80),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  cargoWeight: z.coerce.number().min(1),
  distance: z.coerce.number().min(1),
});

export const completeTripSchema = z.object({
  finalOdometer: z.coerce.number().min(0),
  fuelUsed: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export const queryTripSchema = z.object({
  status: z.enum(["Draft", "Dispatched", "Completed", "Cancelled"]).optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
export type QueryTripInput = z.infer<typeof queryTripSchema>;
