import { NextResponse, type NextRequest } from "next/server";
import { getAuthEnv } from "@/config/auth.server";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { consumeAuthLimit } from "@/infrastructure/supabase/auth-rate-limit";
import { adminAccessRepository } from "@/infrastructure/repositories/admin-access";
import { authorizeAdmin } from "@/application/auth/authorize-admin";
import { privateHeaders, authErrorResponse } from "@/application/auth/http";

export async function GET(request: NextRequest) {
  try {
    const origin = getAuthEnv().NEXT_PUBLIC_SITE_URL;
    const code = request.nextUrl.searchParams.get("code");
    const target = (path: string) => NextResponse.redirect(new URL(path, origin), { headers: privateHeaders });
    if (!code || code.length > 2048) return target("/auth/login?status=invalid-link");
    await consumeAuthLimit("callback", "recovery-callback");
    const client = await createServerSupabaseClient({ writableCookies: true });
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return target("/auth/login?status=invalid-link");
    try { await authorizeAdmin(adminAccessRepository(client)); }
    catch {
      await client.auth.signOut({ scope: "local" });
      return target("/auth/login?status=invalid-link");
    }
    // No user-controlled destination. PKCE prevents login CSRF/code injection.
    return target("/auth/reset-password");
  } catch (error) { return authErrorResponse(error); }
}
