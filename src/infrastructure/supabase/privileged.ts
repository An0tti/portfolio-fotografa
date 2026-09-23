import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/config/env.public";
import { getPrivilegedEnv } from "@/config/env.server";
import type { Database } from "@/types/database";

// Bypasses RLS. Future callers must authorize the operation before using it.
// No cookies or user session may be injected into this client.
export function createPrivilegedSupabaseClient() {
  const env = getPublicEnv();
  const { SUPABASE_SECRET_KEY } = getPrivilegedEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
