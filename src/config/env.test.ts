import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicEnv } from "./env.public";

vi.mock("server-only", () => ({}));
import { getDatabaseEnv, getPrivilegedEnv } from "./env.server";

afterEach(() => vi.unstubAllEnvs());

describe("environment boundaries", () => {
  it("fails on missing public configuration without values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
    expect(getPublicEnv).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("accepts public configuration without requiring a secret", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_only");
    vi.stubEnv("SUPABASE_SECRET_KEY", undefined);
    expect(getPublicEnv()).not.toHaveProperty("SUPABASE_SECRET_KEY");
    expect(getPrivilegedEnv).toThrow("SUPABASE_SECRET_KEY");
  });

  it("rejects privileged keys in public configuration without leaking them", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    const secret = "sb_secret_test_only";
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", secret);
    try { getPublicEnv(); throw new Error("Expected rejection"); }
    catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
      expect((error as Error).message).not.toContain(secret);
    }
  });

  it.each(["http://remote.example.com", "https://user:password@example.com", "ftp://example.com"])("rejects unsafe endpoint %s", (url) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_only");
    expect(getPublicEnv).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("rejects invalid database URLs without exposing their contents", () => {
    vi.stubEnv("DATABASE_URL", "https://user:private-test-value@example.com");
    expect(getDatabaseEnv).toThrow(/^Variáveis de ambiente ausentes ou inválidas: DATABASE_URL$/);
  });
});
