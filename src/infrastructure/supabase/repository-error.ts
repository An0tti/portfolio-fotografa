import { ApplicationError } from "@/lib/errors/application-error";

// Deliberately discard provider messages, details and hints.
export function mapRepositoryError(error: { code: string }): ApplicationError {
  switch (error.code) {
    case "23505": return new ApplicationError("CONFLICT");
    case "23503":
    case "23514":
    case "23502":
    case "22P02": return new ApplicationError("INVALID_INPUT");
    case "42501": return new ApplicationError("FORBIDDEN");
    case "PGRST301": return new ApplicationError("UNAUTHENTICATED");
    default: return new ApplicationError("DEPENDENCY_UNAVAILABLE");
  }
}
