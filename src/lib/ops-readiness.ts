import { db } from "@/lib/db";
import { isAuthConfigured } from "@/lib/auth";
import {
  getMissingDatabaseEnvKeys,
  getMissingDigestEmailEnvKeys,
  hasMigrationFiles,
  hasVercelCronPath,
  isCronSecretConfigured,
  isDatabaseConfigured,
  isDigestEmailConfigured,
} from "@/lib/infrastructure";
import { trackedSources } from "@/lib/profile";

export type ReadinessStatus = "ready" | "warning" | "blocked";

export type ReadinessCheck = {
  id: string;
  label: string;
  status: ReadinessStatus;
  summary: string;
  detail: string;
};

async function getDatabaseCheck(): Promise<ReadinessCheck> {
  if (!isDatabaseConfigured()) {
    return {
      id: "database",
      label: "Database",
      status: "blocked",
      summary: "Banco ainda nao configurado",
      detail:
        `Defina ${getMissingDatabaseEnvKeys().join(", ")} para ligar o Postgres de producao e persistir o radar de forma real.`,
    };
  }

  try {
    await db.$queryRaw`SELECT 1`;

    return {
      id: "database",
      label: "Database",
      status: "ready",
      summary: "Conexao com banco responde",
      detail:
        "A aplicacao consegue abrir conexao com o banco configurado. O proximo passo e garantir migrations aplicadas no ambiente.",
    };
  } catch (error) {
    return {
      id: "database",
      label: "Database",
      status: "blocked",
      summary: "Banco configurado, mas sem conexao valida",
      detail:
        error instanceof Error
          ? error.message
          : "Falha ao abrir conexao com o banco configurado.",
    };
  }
}

async function getSchemaCheck(): Promise<ReadinessCheck> {
  if (!hasMigrationFiles()) {
    return {
      id: "schema",
      label: "Schema migrations",
      status: "blocked",
      summary: "Nenhuma migration Prisma encontrada",
      detail:
        "Versione ao menos uma migration para que o schema de producao nao dependa de estado implícito local.",
    };
  }

  if (!isDatabaseConfigured()) {
    return {
      id: "schema",
      label: "Schema migrations",
      status: "warning",
      summary: "Migration baseline pronta no repo",
      detail:
        "O schema inicial ja esta versionado. Falta ligar o Postgres real e aplicar `prisma migrate deploy` no ambiente alvo.",
    };
  }

  try {
    const [migrationTable] = await db.$queryRaw<Array<{ migrationTable: string | null }>>`
      SELECT to_regclass('public._prisma_migrations') AS "migrationTable"
    `;

    if (!migrationTable?.migrationTable) {
      return {
        id: "schema",
        label: "Schema migrations",
        status: "blocked",
        summary: "Banco conectado, mas migrations ainda nao aplicadas",
        detail:
          "A conexao responde, mas a tabela `_prisma_migrations` ainda nao existe no banco configurado.",
      };
    }

    const [countResult] = await db.$queryRaw<Array<{ migrationCount: number }>>`
      SELECT COUNT(*)::int AS "migrationCount" FROM "_prisma_migrations"
    `;

    return {
      id: "schema",
      label: "Schema migrations",
      status: countResult?.migrationCount > 0 ? "ready" : "warning",
      summary:
        countResult?.migrationCount > 0
          ? `${countResult.migrationCount} migration(s) aplicadas`
          : "Tabela de migrations existe, mas sem historico aplicado",
      detail:
        countResult?.migrationCount > 0
          ? "O banco ja tem historico de migrations e o schema saiu do modo implícito."
          : "Confira se o ambiente foi provisionado corretamente e rode o deploy de migrations.",
    };
  } catch (error) {
    return {
      id: "schema",
      label: "Schema migrations",
      status: "blocked",
      summary: "Nao foi possivel validar o estado das migrations",
      detail:
        error instanceof Error
          ? error.message
          : "Falha ao inspecionar `_prisma_migrations` no banco configurado.",
    };
  }
}

function getAuthCheck(): ReadinessCheck {
  return isAuthConfigured()
    ? {
        id: "auth",
        label: "Private auth",
        status: "ready",
        summary: "Auth privada configurada",
        detail:
          "ARGUS_ACCESS_PASSWORD e ARGUS_SESSION_SECRET estao definidos, entao o portal pode operar com acesso protegido.",
      }
    : {
        id: "auth",
        label: "Private auth",
        status: "warning",
        summary: "Auth privada desativada por env",
        detail:
          "Defina ARGUS_ACCESS_PASSWORD e ARGUS_SESSION_SECRET para exigir login no ambiente alvo.",
      };
}

function getDiscoveryCheck(): ReadinessCheck {
  const liveCount = trackedSources.filter((source) => /live/i.test(source.status)).length;

  return liveCount >= 3
    ? {
        id: "sources",
        label: "Discovery sources",
        status: "ready",
        summary: `${liveCount} fontes com discovery real`,
        detail:
          "A malha de conectores vivos ja comeca a sustentar uso multi-fonte com mais resiliencia.",
      }
    : {
        id: "sources",
        label: "Discovery sources",
        status: "warning",
        summary: `${liveCount} fontes com discovery real`,
        detail:
          "Ainda vale expandir os conectores reais para reduzir dependencia de poucas fontes e aproximar a visao original.",
      };
}

function getDigestCheck(): ReadinessCheck {
  const cronConfigured =
    hasVercelCronPath("/api/cron/daily-digest") && isCronSecretConfigured();
  const emailConfigured = isDigestEmailConfigured();

  if (cronConfigured && emailConfigured) {
    return {
      id: "digest",
      label: "Daily digest",
      status: "ready",
      summary: "Motor, cron e entrega por email configurados",
      detail:
        "O digest diario pode ser persistido, disparado manualmente e executado por cron com protecao por secret.",
    };
  }

  if (hasVercelCronPath("/api/cron/daily-digest") || emailConfigured) {
    return {
      id: "digest",
      label: "Daily digest",
      status: "warning",
      summary: "Motor de digest pronto, configuracao externa ainda parcial",
      detail:
        `O preview e o envio manual ja existem. Falta fechar ${
          !isCronSecretConfigured() ? "CRON_SECRET" : ""
        }${
          !isCronSecretConfigured() && getMissingDigestEmailEnvKeys().length > 0
            ? " e "
            : ""
        }${
          getMissingDigestEmailEnvKeys().length > 0
            ? getMissingDigestEmailEnvKeys().join(", ")
            : ""
        } para operacao totalmente automatizada.`,
    };
  }

  return {
    id: "digest",
    label: "Daily digest",
    status: "blocked",
    summary: "Motor do digest existe, mas automacao ainda nao foi configurada",
    detail:
      `Adicione vercel cron + ${[
        "CRON_SECRET",
        ...getMissingDigestEmailEnvKeys(),
      ].join(", ")} para fechar o ciclo matinal.`,
  };
}

function getCiCheck(): ReadinessCheck {
  return {
    id: "ci",
    label: "CI / branch protection",
    status: "warning",
    summary: "Pipeline local validado, governanca remota ainda parcial",
    detail:
      "Lint, typecheck e build passam localmente, mas a esteira final de branch protection e operacao completa do GitHub ainda dependem da conta.",
  };
}

export async function getOperationalReadiness() {
  const checks = [
    getAuthCheck(),
    await getDatabaseCheck(),
    await getSchemaCheck(),
    getDiscoveryCheck(),
    getDigestCheck(),
    getCiCheck(),
  ];

  return {
    checks,
    readyCount: checks.filter((check) => check.status === "ready").length,
    warningCount: checks.filter((check) => check.status === "warning").length,
    blockedCount: checks.filter((check) => check.status === "blocked").length,
  };
}
