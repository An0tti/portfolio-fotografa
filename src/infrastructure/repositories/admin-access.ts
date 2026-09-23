import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AdminAccessRepository } from "@/domain/auth/admin";
import { ApplicationError } from "@/lib/errors/application-error";

export function adminAccessRepository(client: SupabaseClient<Database>): AdminAccessRepository {
  return {
    async getVerifiedUserId() {
      const { data, error } = await client.auth.getUser();
      if (error) {
        if (error.status && error.status >= 500) throw new ApplicationError("DEPENDENCY_UNAVAILABLE");
        return null;
      }
      return data.user?.id ?? null;
    },
    async isActiveAdmin(userId) {
      const { data, error } = await client.from("admin_users")
        .select("user_id, active").eq("user_id", userId).eq("active", true).maybeSingle();
      if (error) throw new ApplicationError("DEPENDENCY_UNAVAILABLE");
      return data?.user_id === userId && data.active === true;
    },
  };
}
