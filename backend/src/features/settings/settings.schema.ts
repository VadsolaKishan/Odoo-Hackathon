import { z } from "zod";

export const updateSettingsSchema = z.object({
  departmentName: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  distanceUnit: z.string().min(1).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
