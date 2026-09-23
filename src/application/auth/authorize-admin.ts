import type { AdminAccessRepository, AdminUser } from "@/domain/auth/admin";
import { ApplicationError } from "@/lib/errors/application-error";

export async function authorizeAdmin(repository: AdminAccessRepository): Promise<AdminUser> {
  const userId = await repository.getVerifiedUserId();
  if (!userId) throw new ApplicationError("UNAUTHENTICATED");
  if (!await repository.isActiveAdmin(userId)) throw new ApplicationError("FORBIDDEN");
  return { userId };
}
