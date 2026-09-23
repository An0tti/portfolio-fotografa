export type ErrorCode = "INVALID_INPUT" | "UNAUTHENTICATED" | "FORBIDDEN" |
  "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "DEPENDENCY_UNAVAILABLE";

const messages: Record<ErrorCode, string> = {
  INVALID_INPUT: "Dados inválidos.",
  UNAUTHENTICATED: "Autenticação necessária.",
  FORBIDDEN: "Acesso negado.",
  NOT_FOUND: "Recurso indisponível.",
  CONFLICT: "A operação conflita com o estado atual.",
  RATE_LIMITED: "Limite de solicitações excedido.",
  DEPENDENCY_UNAVAILABLE: "Serviço temporariamente indisponível.",
};

export class ApplicationError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(messages[code]);
    this.name = "ApplicationError";
  }
}
