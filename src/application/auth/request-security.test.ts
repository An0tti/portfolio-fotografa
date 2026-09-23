import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { validateOrigin } from "./request-security";

it.each([null, "null", "https://evil.test", "https://site.test.evil.test", "http://site.test", "https://site.test/"])("rejects untrusted/missing Origin %s", (origin) => {
  expect(() => validateOrigin(origin, "https://site.test")).toThrow();
});
it("accepts the exact configured origin", () => expect(() => validateOrigin("https://site.test", "https://site.test/")).not.toThrow());
