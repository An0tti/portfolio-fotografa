import { expect, it } from "vitest";
import { loginSchema, passwordSchema, safeAdminRedirect } from "./schemas";

it.each(["https://evil.test", "//evil.test", "/\\evil.test", "%2f%2fevil.test", "/admin/../evil", "/admin?next=https://evil.test", "javascript:alert(1)", "\r\nLocation: https://evil.test", null, ["/admin"]])("rejects unapproved redirect %s", (value) => {
  expect(safeAdminRedirect(value)).toBe("/admin");
});
it("allows only the implemented destination", () => expect(safeAdminRedirect("/admin")).toBe("/admin"));
it("normalizes email but preserves password and bounds inputs", () => {
  expect(loginSchema.parse({ email: " ADMIN@example.com ", password: " pass " })).toEqual({ email: "admin@example.com", password: " pass " });
  expect(loginSchema.safeParse({ email: "a@b.com", password: "a".repeat(129) }).success).toBe(false);
});
it("requires a long matching password", () => {
  expect(passwordSchema.safeParse({ password: "short", confirmation: "short" }).success).toBe(false);
  expect(passwordSchema.safeParse({ password: "long-password", confirmation: "wrong-password" }).success).toBe(false);
  expect(passwordSchema.safeParse({ password: "long-password", confirmation: "long-password" }).success).toBe(true);
});
