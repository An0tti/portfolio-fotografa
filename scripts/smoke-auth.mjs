import assert from "node:assert/strict";

// Read-only HTTP smoke against an already running application. No account is created.
const origin = process.env.AUTH_SMOKE_ORIGIN ?? "http://localhost:3000";
const parsed = new URL(origin);
assert(["localhost", "127.0.0.1"].includes(parsed.hostname), "Smoke requires localhost");
let checks = 0;
async function request(path, expectedStatus, options = {}) {
  const response = await fetch(new URL(path, origin), { redirect: "manual", ...options });
  assert.equal(response.status, expectedStatus, path);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/, path);
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/, path);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer", path);
  checks++;
  return response;
}
const login = await request("/auth/login?next=https://evil.example", 200);
assert.match(await login.text(), /Acesso administrativo/);
await request("/auth/forgot-password", 200);
const admin = await request("/admin", 307);
assert.equal(new URL(admin.headers.get("location"), origin).pathname, "/auth/login");
const api = await request("/api/admin/session", 401);
assert.equal((await api.json()).error, "UNAUTHENTICATED");
await request("/auth/reset-password", 307);
const callback = await request("/auth/callback?next=https://evil.example", 307);
assert.equal(new URL(callback.headers.get("location"), origin).pathname, "/auth/login");
assert.equal(new URL(callback.headers.get("location"), origin).origin, parsed.origin);
// Cookie presence alone cannot authorize access. No real token/credential is used.
await request("/api/admin/session", 401, { headers: { Cookie: "sb-forged-auth-token=forged; admin=true" } });
console.log(`${checks} HTTP authentication smoke checks passed.`);
