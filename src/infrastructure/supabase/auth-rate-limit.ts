import "server-only";
import { createHmac } from "node:crypto";
import { getAuthEnv } from "@/config/auth.server";
import { createPrivilegedSupabaseClient } from "./privileged";
import { ApplicationError } from "@/lib/errors/application-error";

export type AuthOperation = "login" | "recover" | "password" | "callback";

// Only this fixed RPC is exposed to pre-authentication use cases. No user CRUD.
// A global bucket also bounds random-address attacks without trusting forwarded IP headers.
export async function consumeAuthLimit(operation: AuthOperation, identifier: string) {
  const { AUTH_RATE_LIMIT_SECRET } = getAuthEnv();
  const key = createHmac("sha256", AUTH_RATE_LIMIT_SECRET).update(identifier).digest("hex");
  const client = createPrivilegedSupabaseClient();
  for (const bucket of ["global", key]) {
    const { data, error } = await client.rpc("consume_auth_rate_limit", { p_operation: operation, p_key: bucket });
    if (error) throw new ApplicationError("DEPENDENCY_UNAVAILABLE");
    if (data !== true) throw new ApplicationError("RATE_LIMITED");
  }
}
