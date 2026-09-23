import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/config/env.public";
import { getAuthEnv } from "@/config/auth.server";
import { privateHeaders } from "@/application/auth/http";
import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  try {
    const env = getPublicEnv();
    const authEnv = getAuthEnv();
    const client = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          for (const { name, value } of values) request.cookies.set(name, value);
          const previousCookies = response.cookies.getAll();
          response = NextResponse.next({ request });
          for (const cookie of previousCookies) response.cookies.set(cookie);
          for (const { name, value, options } of values) response.cookies.set(name, value, options);
        },
      },
    });
    const { data, error } = await client.auth.getUser();
    // Preliminary navigation only. APIs/Actions/pages independently authorize.
    if ((error || !data.user) && request.method === "GET" &&
        (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/") ||
          request.nextUrl.pathname === "/auth/reset-password")) {
      const destination = new URL("/auth/login?status=session-expired", authEnv.NEXT_PUBLIC_SITE_URL);
      const redirected = NextResponse.redirect(destination);
      for (const cookie of response.cookies.getAll()) redirected.cookies.set(cookie);
      response = redirected;
    }
  } catch {
    const unavailable = new NextResponse("Serviço temporariamente indisponível. Tente novamente mais tarde.", { status: 503 });
    for (const cookie of response.cookies.getAll()) unavailable.cookies.set(cookie);
    response = unavailable;
  }
  for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value);
  return response;
}

export const config = { matcher: ["/admin/:path*", "/auth/:path*", "/api/admin/:path*"] };
