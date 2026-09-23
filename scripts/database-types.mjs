import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Cloud Management API: no Docker. No shell redirection
// (PowerShell 5 redirects as UTF-16), and do not truncate the file on CLI failure.
const cli = fileURLToPath(new URL("../node_modules/supabase/dist/supabase.js", import.meta.url));
let projectRef;
try {
  projectRef = readFileSync(new URL("../supabase/.temp/project-ref", import.meta.url), "utf8").trim();
} catch {
  console.error("Projeto Cloud não vinculado. Consulte docs/DATA_ACCESS.md antes de conectar o projeto de desenvolvimento.");
  process.exit(1);
}
if (!/^[a-z0-9]+$/.test(projectRef)) {
  console.error("Referência de projeto inválida.");
  process.exit(1);
}
const result = spawnSync(process.execPath, [cli, "gen", "types", "typescript", "--project-id", projectRef, "--schema", "public"], { encoding: "utf8" });
if (result.error || result.status !== 0 || !result.stdout.includes("export type Database")) {
  console.error("Falha ao gerar tipos. Confirme o login da CLI e as migrations do projeto Cloud vinculado.");
  process.exit(1);
}
const target = new URL("../src/types/database.ts", import.meta.url);
const normalize = (value) => value.replace(/\r\n/g, "\n").trimEnd() + "\n";
const generated = normalize(result.stdout);
if (process.argv.includes("--check")) {
  if (normalize(readFileSync(target, "utf8")) !== generated) {
    console.error("Tipos divergem do banco Cloud. Execute npm run db:types e revise o diff.");
    process.exit(1);
  }
} else {
  const temporary = new URL("../src/types/database.ts.tmp", import.meta.url);
  writeFileSync(temporary, generated, "utf8");
  renameSync(temporary, target);
}
