import { expect, it } from "vitest";
import { mapRepositoryError } from "./repository-error";

it.each([
  ["23505", "CONFLICT"], ["23503", "INVALID_INPUT"],
  ["42501", "FORBIDDEN"], ["PGRST301", "UNAUTHENTICATED"],
  ["unknown", "DEPENDENCY_UNAVAILABLE"],
])("maps %s to a safe %s error", (code, expected) => {
  const providerError = { code, message: "private database detail", details: "private row" };
  const error = mapRepositoryError(providerError);
  expect(error.code).toBe(expected);
  expect(JSON.stringify(error)).not.toContain("private");
  expect(error.message).not.toContain("private");
  expect(error.cause).toBeUndefined();
});
