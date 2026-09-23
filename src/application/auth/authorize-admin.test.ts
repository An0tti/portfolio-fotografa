import { expect, it, vi } from "vitest";
import { authorizeAdmin } from "./authorize-admin";

it("rejects missing, forged or expired identity before querying authorization", async () => {
  const repository = { getVerifiedUserId: vi.fn().mockResolvedValue(null), isActiveAdmin: vi.fn() };
  await expect(authorizeAdmin(repository)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  expect(repository.isActiveAdmin).not.toHaveBeenCalled();
});

it("rejects authenticated users without an active administrator record", async () => {
  await expect(authorizeAdmin({ getVerifiedUserId: async () => "user", isActiveAdmin: async () => false }))
    .rejects.toMatchObject({ code: "FORBIDDEN" });
});

it("rechecks active status on every operation, including deactivation with a valid token", async () => {
  const isActiveAdmin = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  const repository = { getVerifiedUserId: async () => "admin", isActiveAdmin };
  expect(await authorizeAdmin(repository)).toEqual({ userId: "admin" });
  await expect(authorizeAdmin(repository)).rejects.toMatchObject({ code: "FORBIDDEN" });
  expect(isActiveAdmin).toHaveBeenCalledTimes(2);
});
