import fs from "fs";
import path from "path";

const rootDir = path.join(__dirname, "..", "..");

loadEnvFile(path.join(rootDir, ".env"));

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf-8").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.PG_HOST;
  const port = process.env.PG_PORT ?? "5432";
  const db = process.env.PG_DB;
  const user = process.env.PG_USER;
  const password = process.env.PG_PASSWORD;

  if (host && db && user && password) {
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
  }

  return "";
}

// Rôle restreint (SELECT/INSERT/UPDATE/DELETE) utilisé par l'app au quotidien.
// Retombe sur databaseUrl (rôle propriétaire) tant que le rôle restreint n'a pas été
// créé via `npm run db:migrate` — évite de casser l'app pendant la transition.
function buildAppDatabaseUrl(): string {
  if (process.env.DATABASE_APP_URL) return process.env.DATABASE_APP_URL;

  const host = process.env.PG_HOST;
  const port = process.env.PG_PORT ?? "5432";
  const db = process.env.PG_DB;
  const user = process.env.PG_APP_USER;
  const password = process.env.PG_APP_PASSWORD;

  if (host && db && user && password) {
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
  }

  return "";
}

const databaseUrl = buildDatabaseUrl();

export const config = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  footballApiKey: process.env.FOOTBALL_DATA_API_KEY ?? "",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  tokenSecret: process.env.TOKEN_SECRET ?? "cdm2026_dev_secret_changeme",
  publicDir: path.join(rootDir, "public"),
  mockFile: path.join(rootDir, "data/mock-matches.json"),
  databaseUrl,
  appDatabaseUrl: buildAppDatabaseUrl() || databaseUrl,
};
