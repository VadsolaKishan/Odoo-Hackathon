import { z } from "zod";

export const createExpenseSchema = z.object({
  tripId: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  toll: z.coerce.number().min(0).default(0),
  repair: z.coerce.number().min(0).default(0),
  misc: z.coerce.number().min(0).default(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
