import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const requireAdmin = vi.hoisted(() => vi.fn());
vi.mock("@/application/auth/session", () => ({ requireAdmin }));
import { ApplicationError } from "@/lib/errors/application-error";
import { GET } from "./route";

it.each([["UNAUTHENTICATED", 401], ["FORBIDDEN", 403], ["DEPENDENCY_UNAVAILABLE", 503]] as const)("direct API call fails closed for %s", async (code, status) => {
  requireAdmin.mockRejectedValue(new ApplicationError(code));
  const response = await GET();
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(await response.json()).toMatchObject({ error: code });
});
it("returns only minimal confirmation to an active admin", async () => {
  requireAdmin.mockResolvedValue({ admin: { userId: "not-exposed" } });
  const response = await GET();
  expect(await response.json()).toEqual({ authorized: true });
});
