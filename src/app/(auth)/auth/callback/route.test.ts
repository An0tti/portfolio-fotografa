import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ exchange: vi.fn(), signOut: vi.fn(), authorize: vi.fn(), limit: vi.fn() }));
vi.mock("@/config/auth.server", () => ({ getAuthEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://site.test" }) }));
vi.mock("@/infrastructure/supabase/server", () => ({ createServerSupabaseClient: async () => ({ auth: { exchangeCodeForSession: mocks.exchange, signOut: mocks.signOut } }) }));
vi.mock("@/application/auth/authorize-admin", () => ({ authorizeAdmin: mocks.authorize }));
vi.mock("@/infrastructure/supabase/auth-rate-limit", () => ({ consumeAuthLimit: mocks.limit }));
import { GET } from "./route";
beforeEach(() => { vi.resetAllMocks(); mocks.exchange.mockResolvedValue({ error: null }); });
it("exchanges the PKCE code, checks authorization and uses a fixed destination", async () => {
  const response = await GET(new NextRequest("https://evil.test/auth/callback?code=test-code&next=https://evil.test"));
  expect(mocks.exchange).toHaveBeenCalledWith("test-code");
  expect(mocks.authorize).toHaveBeenCalledOnce();
  expect(response.headers.get("location")).toBe("https://site.test/auth/reset-password");
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("rejects expired/replayed codes or missing PKCE verifier", async () => {
  mocks.exchange.mockResolvedValue({ error: { message: "private provider detail" } });
  const response = await GET(new NextRequest("https://site.test/auth/callback?code=expired"));
  expect(response.headers.get("location")).toBe("https://site.test/auth/login?status=invalid-link");
  expect(mocks.authorize).not.toHaveBeenCalled();
});
it("discards the newly issued session if the account is not an active admin", async () => {
  mocks.authorize.mockRejectedValue(new Error("denied"));
  const response = await GET(new NextRequest("https://site.test/auth/callback?code=test-code"));
  expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  expect(response.headers.get("location")).toContain("invalid-link");
});
it("does not exchange missing or oversized codes", async () => {
  await GET(new NextRequest("https://site.test/auth/callback"));
  await GET(new NextRequest(`https://site.test/auth/callback?code=${"a".repeat(2049)}`));
  expect(mocks.exchange).not.toHaveBeenCalled();
});
