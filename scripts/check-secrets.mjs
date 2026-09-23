import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const privateNames = ["SUPABASE_SECRET_KEY", "DATABASE_URL", "AUTH_RATE_LIMIT_SECRET"];
const privateValues = privateNames.map((name) => process.env[name]).filter((value) => value && value.length >= 12);
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]);
}
const staticFiles = walk(".next/static");
let failures = 0;
for (const file of [...files, ...staticFiles]) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, "utf8");
  if (privateValues.some((value) => content.includes(value)) || /sb_secret_[A-Za-z0-9_-]{24,}/.test(content)) {
    console.error(`Possible credential in ${file} (value redacted)`);
    failures++;
  }
}
const badNames = Object.keys(process.env).filter((name) => name.startsWith("NEXT_PUBLIC_") && /SECRET|DATABASE|SERVICE_ROLE/.test(name));
if (badNames.length) { console.error("Private credential name uses public prefix"); failures++; }
if (files.some((file) => /(^|\/)\.env(\.|$)/.test(file) && file !== ".env.example")) {
  console.error("Private environment file is not ignored"); failures++;
}
if (!staticFiles.length) { console.error("Build first: no client bundle to inspect"); failures++; }
if (failures) process.exitCode = 1;
else console.log(`Secret checks passed: ${files.length} source files and ${staticFiles.length} client artifacts; values not printed.`);
