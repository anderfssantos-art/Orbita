import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(rootDir, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] ??= match[2].trim();
  }
}

const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/run-migration.mjs <caminho-do-arquivo.sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf-8");

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log(`✓ Migração aplicada: ${file}`);
} catch (err) {
  console.error(`✗ Erro ao aplicar ${file}:`, err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
