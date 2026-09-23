import "server-only";
import { headers } from "next/headers";
import { getAuthEnv } from "@/config/auth.server";
import { ApplicationError } from "@/lib/errors/application-error";

export function validateOrigin(origin: string | null, expected: string) {
  if (origin !== new URL(expected).origin) throw new ApplicationError("FORBIDDEN");
}

export async function assertMutationOrigin() {
  validateOrigin((await headers()).get("origin"), getAuthEnv().NEXT_PUBLIC_SITE_URL);
}
