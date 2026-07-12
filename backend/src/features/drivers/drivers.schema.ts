import { z } from "zod";

export const createDriverSchema = z.object({
  name: z.string().trim().min(2).max(80),
  license: z.string().trim().min(5).max(40),
  category: z.enum(["LMV", "HMV", "HTV", "PSV"]),
  expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  phone: z.string().trim().min(6).max(20),
  safetyScore: z.coerce.number().int().min(0).max(100),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]).default("Available"),
});

export const updateDriverSchema = createDriverSchema.partial();

export const queryDriverSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["Available", "On Trip", "Off Duty", "Suspended"]).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type QueryDriverInput = z.infer<typeof queryDriverSchema>;
