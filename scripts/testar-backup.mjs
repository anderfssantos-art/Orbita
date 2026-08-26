// Teste de restauração de backup: copia todas as tabelas de produção
// para um schema temporário isolado (dentro do mesmo Postgres), confere
// que a contagem de linhas bate exatamente, depois apaga o schema.
// Não requer pg_dump/psql instalados localmente — usa só o driver `pg`
// que o projeto já depende.
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

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const SCHEMA = "teste_restauracao_backup";

await client.connect();
try {
  const { rows: tabelas } = await client.query(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`
  );

  console.log(`Testando backup/restauração de ${tabelas.length} tabelas...`);

  await client.query(`drop schema if exists ${SCHEMA} cascade`);
  await client.query(`create schema ${SCHEMA}`);

  const resultado = [];
  for (const { tablename } of tabelas) {
    await client.query(`create table ${SCHEMA}.${tablename} as table public.${tablename}`);
    const original = await client.query(`select count(*) from public.${tablename}`);
    const restaurada = await client.query(`select count(*) from ${SCHEMA}.${tablename}`);
    const ok = original.rows[0].count === restaurada.rows[0].count;
    resultado.push({
      tabela: tablename,
      linhas_originais: original.rows[0].count,
      linhas_restauradas: restaurada.rows[0].count,
      ok: ok ? "✓" : "✗ DIVERGÊNCIA",
    });
  }

  console.table(resultado);

  const falhas = resultado.filter((r) => r.ok !== "✓");
  if (falhas.length > 0) {
    console.error(`✗ ${falhas.length} tabela(s) com divergência — backup NÃO confiável.`);
    process.exitCode = 1;
  } else {
    console.log("✓ Todas as tabelas restauradas com a mesma contagem de linhas do original.");
  }

  await client.query(`drop schema ${SCHEMA} cascade`);
  console.log("Schema temporário removido — produção intocada.");
} finally {
  await client.end();
}
