import fs from "node:fs";
import path from "node:path";

const DATABASE_REQUIRED_ENV = ["DATABASE_URL", "DIRECT_URL"] as const;
const DIGEST_EMAIL_REQUIRED_ENV = [
  "RESEND_API_KEY",
  "ARGUS_DIGEST_FROM_EMAIL",
  "ARGUS_DIGEST_TO_EMAIL",
] as const;

export function isDatabaseConfigured() {
  return DATABASE_REQUIRED_ENV.every((envKey) => Boolean(process.env[envKey]));
}

export function isDigestEmailConfigured() {
  return DIGEST_EMAIL_REQUIRED_ENV.every((envKey) => Boolean(process.env[envKey]));
}

export function getCronSecret() {
  return process.env.CRON_SECRET ?? process.env.ARGUS_CRON_SECRET ?? null;
}

export function isCronSecretConfigured() {
  return Boolean(getCronSecret());
}

export function getPrismaMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

  if (!fs.existsSync(migrationsDir)) {
    return [] as string[];
  }

  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(migrationsDir, entry.name, "migration.sql"))
    .filter((filePath) => fs.existsSync(filePath));
}

export function hasMigrationFiles() {
  return getPrismaMigrationFiles().length > 0;
}

export function getVercelCronConfig() {
  const vercelConfigPath = path.join(process.cwd(), "vercel.json");

  if (!fs.existsSync(vercelConfigPath)) {
    return [] as Array<{ path?: string; schedule?: string }>;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8")) as {
      crons?: Array<{ path?: string; schedule?: string }>;
    };

    return Array.isArray(parsed.crons) ? parsed.crons : [];
  } catch {
    return [];
  }
}

export function hasVercelCronPath(routePath: string) {
  return getVercelCronConfig().some((cron) => cron.path === routePath);
}
