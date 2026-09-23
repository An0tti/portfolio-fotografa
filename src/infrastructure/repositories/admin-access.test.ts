import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
vi.mock("server-only", () => ({}));
import { adminAccessRepository } from "./admin-access";

function fixture(data: unknown, error: unknown = null) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  const client = { from: vi.fn().mockReturnValue(query), auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin" } }, error: null }) } };
  return { query, client, repository: adminAccessRepository(client as unknown as SupabaseClient<Database>) };
}
it("uses verified getUser and a minimal RLS-filtered active row", async () => {
  const { repository, query, client } = fixture({ user_id: "admin", active: true });
  expect(await repository.getVerifiedUserId()).toBe("admin");
  expect(await repository.isActiveAdmin("admin")).toBe(true);
  expect(client.auth.getUser).toHaveBeenCalledOnce();
  expect(query.select).toHaveBeenCalledWith("user_id, active");
  expect(query.eq).toHaveBeenCalledWith("user_id", "admin");
  expect(query.eq).toHaveBeenCalledWith("active", true);
});
it.each([null, { user_id: "other", active: true }, { user_id: "admin", active: false }])("rejects missing or mismatched rows", async (row) => {
  expect(await fixture(row).repository.isActiveAdmin("admin")).toBe(false);
});
it("fails closed on repository failure and discards raw errors", async () => {
  await expect(fixture(null, { message: "private SQL" }).repository.isActiveAdmin("admin"))
    .rejects.toMatchObject({ code: "DEPENDENCY_UNAVAILABLE" });
});
it("rejects an invalid token even when untrusted user data exists", async () => {
  const { client, repository } = fixture(null);
  client.auth.getUser.mockResolvedValue({ data: { user: { id: "forged" } }, error: { status: 401 } });
  expect(await repository.getVerifiedUserId()).toBeNull();
});
