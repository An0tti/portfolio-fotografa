import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  origin: vi.fn(), limit: vi.fn(), requireAdmin: vi.fn(), authorize: vi.fn(),
  signInWithPassword: vi.fn(), signOut: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("./request-security", () => ({ assertMutationOrigin: mocks.origin }));
vi.mock("./session", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("./authorize-admin", () => ({ authorizeAdmin: mocks.authorize }));
vi.mock("@/infrastructure/supabase/auth-rate-limit", () => ({ consumeAuthLimit: mocks.limit }));
vi.mock("@/config/auth.server", () => ({ getAuthEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://site.test" }) }));
vi.mock("@/infrastructure/supabase/server", () => ({ createServerSupabaseClient: async () => ({ auth: mocks }) }));
import { ApplicationError } from "@/lib/errors/application-error";
import { loginAction, logoutAction, recoverAction, updatePasswordAction } from "./actions";
const state = { message: "" };
function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.signInWithPassword.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.requireAdmin.mockResolvedValue({ client: { auth: mocks }, admin: { userId: "admin" } });
});
it("authorizes after login and never redirects to arbitrary input", async () => {
  await expect(loginAction(state, form({ email: "admin@site.test", password: "password", next: "https://evil.test" })))
    .rejects.toThrow("REDIRECT:/admin");
  expect(mocks.authorize).toHaveBeenCalledOnce();
});
it("clears a session when authenticated but inactive or unlisted", async () => {
  mocks.authorize.mockRejectedValue(new ApplicationError("FORBIDDEN"));
  const result = await loginAction(state, form({ email: "admin@site.test", password: "password" }));
  expect(result.message).toContain("Não foi possível entrar");
  expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
});
it("does not call Auth if the persistent limiter rejects or fails", async () => {
  mocks.limit.mockRejectedValue(new ApplicationError("RATE_LIMITED"));
  expect((await loginAction(state, form({ email: "admin@site.test", password: "password" }))).message).toContain("15 minutos");
  expect(mocks.signInWithPassword).not.toHaveBeenCalled();
});
it("rejects direct password mutations without active authorization", async () => {
  mocks.requireAdmin.mockRejectedValue(new ApplicationError("UNAUTHENTICATED"));
  await updatePasswordAction(state, form({ password: "new-password", confirmation: "new-password" }));
  expect(mocks.updateUser).not.toHaveBeenCalled();
});
it("rejects cross-origin direct actions before calling services", async () => {
  mocks.origin.mockRejectedValue(new ApplicationError("FORBIDDEN"));
  await loginAction(state, form({ email: "admin@site.test", password: "password" }));
  await recoverAction(state, form({ email: "admin@site.test" }));
  await updatePasswordAction(state, form({ password: "new-password", confirmation: "new-password" }));
  await logoutAction();
  expect(mocks.limit).not.toHaveBeenCalled();
  expect(mocks.signOut).not.toHaveBeenCalled();
  expect(mocks.requireAdmin).not.toHaveBeenCalled();
});
it("returns the same recovery message for known and unknown addresses", async () => {
  const first = await recoverAction(state, form({ email: "admin@site.test" }));
  mocks.resetPasswordForEmail.mockResolvedValue({ error: { status: 400, message: "user missing" } });
  expect(await recoverAction(state, form({ email: "unknown@site.test" }))).toEqual(first);
  expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("unknown@site.test", { redirectTo: "https://site.test/auth/callback" });
});
it("changes password only after authorization and globally signs out", async () => {
  await expect(updatePasswordAction(state, form({ password: "new-password", confirmation: "new-password" })))
    .rejects.toThrow("REDIRECT:/auth/login?status=password-updated");
  expect(mocks.requireAdmin).toHaveBeenCalledWith(true);
  expect(mocks.signOut).toHaveBeenCalledWith({ scope: "global" });
});
it("logs out deactivated/expired users without granting access", async () => {
  await expect(logoutAction()).rejects.toThrow("REDIRECT:/auth/login?status=logged-out");
  expect(mocks.requireAdmin).not.toHaveBeenCalled();
});
