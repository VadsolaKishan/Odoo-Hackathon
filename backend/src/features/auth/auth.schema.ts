import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  role: z.enum(["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]),
  remember: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
