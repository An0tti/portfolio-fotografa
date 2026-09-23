import { afterEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  browser: vi.fn(), server: vi.fn(), privileged: vi.fn(),
  getAll: vi.fn(() => []), set: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ({ createBrowserClient: mocks.browser, createServerClient: mocks.server }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.privileged }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: mocks.getAll, set: mocks.set }) }));

import { createBrowserSupabaseClient } from "./browser";
import { createServerSupabaseClient } from "./server";
import { createPrivilegedSupabaseClient } from "./privileged";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

function configure() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_only");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_test_only");
}

it("only passes the public key to browser and SSR factories", async () => {
  configure();
  createBrowserSupabaseClient();
  await createServerSupabaseClient();
  expect(mocks.browser.mock.calls[0][1]).toBe("sb_publishable_test_only");
  expect(mocks.server.mock.calls[0][1]).toBe("sb_publishable_test_only");
  expect(JSON.stringify([...mocks.browser.mock.calls, ...mocks.server.mock.calls])).not.toContain("sb_secret");
});

it("isolates privileged client from cookies and persistent user sessions", () => {
  configure();
  createPrivilegedSupabaseClient();
  expect(mocks.privileged).toHaveBeenCalledWith("https://example.supabase.co", "sb_secret_test_only", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
});

it("writes SSR cookies only in an explicitly writable context and propagates failures", async () => {
  configure();
  const values = [{ name: "test-cookie", value: "test-value", options: { httpOnly: true } }];
  await createServerSupabaseClient();
  mocks.server.mock.calls[0][2].cookies.setAll(values);
  expect(mocks.set).not.toHaveBeenCalled();
  await createServerSupabaseClient({ writableCookies: true });
  mocks.server.mock.calls[1][2].cookies.setAll(values);
  expect(mocks.set).toHaveBeenCalledWith("test-cookie", "test-value", { httpOnly: true });
  mocks.set.mockImplementationOnce(() => { throw new Error("cookie failure"); });
  expect(() => mocks.server.mock.calls[1][2].cookies.setAll(values)).toThrow("cookie failure");
});
