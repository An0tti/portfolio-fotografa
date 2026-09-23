"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { adminAccessRepository } from "@/infrastructure/repositories/admin-access";
import { consumeAuthLimit } from "@/infrastructure/supabase/auth-rate-limit";
import { getAuthEnv } from "@/config/auth.server";
import { ApplicationError } from "@/lib/errors/application-error";
import { emailSchema, loginSchema, passwordSchema, safeAdminRedirect, type AuthFormState } from "@/features/auth/schemas";
import { authorizeAdmin } from "./authorize-admin";
import { requireAdmin } from "./session";
import { assertMutationOrigin } from "./request-security";

function failure(error: unknown): AuthFormState {
  if (error instanceof ApplicationError && error.code === "RATE_LIMITED") {
    return { message: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente." };
  }
  if (error instanceof ApplicationError && ["UNAUTHENTICATED", "FORBIDDEN"].includes(error.code)) {
    return { message: "Não foi possível autorizar o acesso. Entre novamente ou solicite um novo link." };
  }
  return { message: "Serviço temporariamente indisponível. Tente novamente mais tarde." };
}

export async function loginAction(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  try {
    await assertMutationOrigin();
    const input = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!input.success) return { message: "Informe um e-mail válido e sua senha." };
    await consumeAuthLimit("login", input.data.email);
    const client = await createServerSupabaseClient({ writableCookies: true });
    const { error } = await client.auth.signInWithPassword(input.data);
    if (error) return { message: "Não foi possível entrar com os dados informados." };
    try { await authorizeAdmin(adminAccessRepository(client)); }
    catch {
      await client.auth.signOut({ scope: "local" });
      return { message: "Não foi possível entrar com os dados informados." };
    }
  } catch (error) { return failure(error); }
  redirect(safeAdminRedirect(form.get("next")));
}

export async function recoverAction(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  try {
    await assertMutationOrigin();
    const email = emailSchema.safeParse(form.get("email"));
    if (!email.success) return { message: "Informe um e-mail válido." };
    await consumeAuthLimit("recover", email.data);
    const client = await createServerSupabaseClient({ writableCookies: true });
    // PKCE verifier stays in this browser. Never look up the submitted email in admin_users.
    const { error } = await client.auth.resetPasswordForEmail(email.data, {
      redirectTo: new URL("/auth/callback", getAuthEnv().NEXT_PUBLIC_SITE_URL).href,
    });
    if (error && (!error.status || error.status >= 500)) throw new ApplicationError("DEPENDENCY_UNAVAILABLE");
    return { success: true, message: "Se o e-mail estiver cadastrado, você receberá um link. Abra-o neste mesmo navegador." };
  } catch (error) { return failure(error); }
}

export async function updatePasswordAction(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  try {
    await assertMutationOrigin();
    const { client, admin } = await requireAdmin(true);
    const input = passwordSchema.safeParse({ password: form.get("password"), confirmation: form.get("confirmation") });
    if (!input.success) return { message: "Use de 12 a 128 caracteres e confirme a mesma senha." };
    await consumeAuthLimit("password", admin.userId);
    const { error } = await client.auth.updateUser({ password: input.data.password });
    if (error) return { message: "Não foi possível atualizar a senha. Solicite um novo link ou use outra senha." };
    const { error: logoutError } = await client.auth.signOut({ scope: "global" });
    if (logoutError) return { message: "Senha alterada. Não foi possível encerrar todas as sessões. Tente sair novamente." };
  } catch (error) { return failure(error); }
  redirect("/auth/login?status=password-updated");
}

export async function logoutAction(): Promise<AuthFormState> {
  try {
    await assertMutationOrigin();
    // Logout must also work for an expired or deactivated user; it grants no access.
    const client = await createServerSupabaseClient({ writableCookies: true });
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw new ApplicationError("DEPENDENCY_UNAVAILABLE");
  } catch (error) { return failure(error); }
  redirect("/auth/login?status=logged-out");
}
