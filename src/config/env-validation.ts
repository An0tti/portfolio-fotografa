import { z } from "zod";

export function parseEnvironment<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    // Never include received values or the original Zod error (may contain secrets).
    throw new Error(`Variáveis de ambiente ausentes ou inválidas: ${names.join(", ")}`);
  }
  return result.data;
}
