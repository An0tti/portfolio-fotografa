import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ create: vi.fn(), getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.create }));
vi.mock("@/config/env.public", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only" }) }));
vi.mock("@/config/auth.server", () => ({ getAuthEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://site.test" }) }));
import { proxy } from "./proxy";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.create.mockReturnValue({ auth: { getUser: mocks.getUser } });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
});
it("passes refreshed cookies to both SSR request and browser without shared caching", async () => {
  const request = new NextRequest("https://site.test/admin");
  mocks.getUser.mockImplementation(async () => {
    mocks.create.mock.calls[0][2].cookies.setAll([{ name: "sb-session", value: "renewed", options: { path: "/", secure: true } }]);
    return { data: { user: { id: "admin" } }, error: null };
  });
  const response = await proxy(request);
  expect(request.cookies.get("sb-session")?.value).toBe("renewed");
  expect(response.cookies.get("sb-session")?.value).toBe("renewed");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("x-middleware-request-cookie")).toContain("renewed");
});
it("preserves cookie invalidation on a redirect and ignores attacker Host", async () => {
  mocks.getUser.mockImplementation(async () => {
    mocks.create.mock.calls[0][2].cookies.setAll([{ name: "sb-session", value: "", options: { maxAge: 0 } }]);
    return { data: { user: null }, error: { status: 401 } };
  });
  const response = await proxy(new NextRequest("https://evil.test/admin"));
  expect(response.headers.get("location")).toBe("https://site.test/auth/login?status=session-expired");
  expect(response.cookies.get("sb-session")?.maxAge).toBe(0);
});
it.each(["/api/admin/session", "/auth/login", "/auth/forgot-password", "/auth/callback"])("leaves %s to its own boundary", async (path) => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } });
  const response = await proxy(new NextRequest(`https://site.test${path}`));
  expect(response.headers.get("location")).toBeNull();
});
it("does not redirect direct POST actions before their own authorization", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } });
  expect((await proxy(new NextRequest("https://site.test/admin", { method: "POST" }))).headers.get("location")).toBeNull();
});
it("fails closed without exposing dependency errors", async () => {
  mocks.getUser.mockRejectedValue(new Error("sensitive details"));
  const response = await proxy(new NextRequest("https://site.test/admin"));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("sensitive details");
});
