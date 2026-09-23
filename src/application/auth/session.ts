import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { adminAccessRepository } from "@/infrastructure/repositories/admin-access";
import { authorizeAdmin } from "./authorize-admin";
import { ApplicationError } from "@/lib/errors/application-error";

// Never cache this across requests: deactivation must affect the next operation.
export async function requireAdmin(writableCookies = false) {
  const client = await createServerSupabaseClient({ writableCookies });
  const admin = await authorizeAdmin(adminAccessRepository(client));
  return { client, admin };
}

export async function requireAdminPage() {
  try { return await requireAdmin(); }
  catch (error) {
    if (error instanceof ApplicationError && ["UNAUTHENTICATED", "FORBIDDEN"].includes(error.code)) {
      redirect("/auth/login?status=session-expired");
    }
    throw new Error("Não foi possível verificar seu acesso. Tente novamente.");
  }
}
