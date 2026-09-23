import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const rpc = vi.hoisted(() => vi.fn());
vi.mock("./privileged", () => ({ createPrivilegedSupabaseClient: () => ({ rpc }) }));
vi.mock("@/config/auth.server", () => ({ getAuthEnv: () => ({ AUTH_RATE_LIMIT_SECRET: "test-only-secret-with-at-least-32-characters" }) }));
import { consumeAuthLimit } from "./auth-rate-limit";

beforeEach(() => { rpc.mockReset().mockResolvedValue({ data: true, error: null }); });
it("bounds global and identifier attempts without storing raw email", async () => {
  await consumeAuthLimit("login", "admin@site.test");
  expect(rpc).toHaveBeenCalledWith("consume_auth_rate_limit", { p_operation: "login", p_key: "global" });
  expect(rpc.mock.calls[1][1].p_key).toMatch(/^[a-f0-9]{64}$/);
  expect(JSON.stringify(rpc.mock.calls)).not.toContain("admin@site.test");
});
it("rejects an exhausted bucket", async () => {
  rpc.mockResolvedValue({ data: false, error: null });
  await expect(consumeAuthLimit("login", "admin@site.test")).rejects.toMatchObject({ code: "RATE_LIMITED" });
  expect(rpc).toHaveBeenCalledTimes(1);
});
it("fails closed on database failure", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "private detail" } });
  await expect(consumeAuthLimit("login", "admin@site.test")).rejects.toMatchObject({ code: "DEPENDENCY_UNAVAILABLE" });
});
