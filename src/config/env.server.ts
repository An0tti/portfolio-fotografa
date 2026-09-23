import "server-only";
import { z } from "zod";
import { parseEnvironment } from "./env-validation";

export function getPrivilegedEnv() {
  return parseEnvironment(z.object({
    SUPABASE_SECRET_KEY: z.string().regex(/^sb_secret_[A-Za-z0-9_-]+$/),
  }), { SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY });
}

export function getDatabaseEnv() {
  return parseEnvironment(z.object({
    DATABASE_URL: z.url().refine((value) => {
      const url = new URL(value);
      return ["postgres:", "postgresql:"].includes(url.protocol) && Boolean(url.hostname && url.username);
    }),
  }), { DATABASE_URL: process.env.DATABASE_URL });
}
