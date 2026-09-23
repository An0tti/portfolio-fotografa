export interface AdminUser { userId: string }

export interface AdminAccessRepository {
  getVerifiedUserId(): Promise<string | null>;
  isActiveAdmin(userId: string): Promise<boolean>;
}
