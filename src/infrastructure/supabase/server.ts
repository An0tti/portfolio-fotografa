import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/config/env.public";
import type { Database } from "@/types/database";

// Per-request client; never cache a user session at module scope.
// Read-only by default for Server Components. Writable contexts opt in explicitly.
export async function createServerSupabaseClient({ writableCookies = false } = {}) {
  const env = getPublicEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        if (!writableCookies) return;
        for (const { name, value, options } of values) cookieStore.set(name, value, options);
      },
    },
  });
}
