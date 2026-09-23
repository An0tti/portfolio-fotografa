import "server-only";
import { z } from "zod";
import { parseEnvironment } from "./env-validation";

export function getAuthEnv() {
  return parseEnvironment(z.object({
    NEXT_PUBLIC_SITE_URL: z.url().refine((value) => {
      const url = new URL(value);
      return !url.username && !url.password && !url.search && !url.hash && url.pathname === "/" &&
        (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)));
    }),
    AUTH_RATE_LIMIT_SECRET: z.string().min(32),
  }), {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    AUTH_RATE_LIMIT_SECRET: process.env.AUTH_RATE_LIMIT_SECRET,
  });
}
