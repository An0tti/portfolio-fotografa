import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
export const passwordSchema = z.object({
  password: z.string().min(12).max(128),
  confirmation: z.string().min(12).max(128),
}).refine((value) => value.password === value.confirmation);

export interface AuthFormState { message: string; success?: boolean }

// Explicit allowlist. Extend only when a new administrative destination exists.
export function safeAdminRedirect(value: unknown): string {
  return value === "/admin" ? value : "/admin";
}
