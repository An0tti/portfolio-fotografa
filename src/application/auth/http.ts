import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ApplicationError } from "@/lib/errors/application-error";

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};

export function authErrorResponse(error: unknown) {
  const code = error instanceof ApplicationError ? error.code : "DEPENDENCY_UNAVAILABLE";
  const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : code === "RATE_LIMITED" ? 429 : 503;
  return NextResponse.json({ error: code, requestId: randomUUID() }, { status, headers: privateHeaders });
}
