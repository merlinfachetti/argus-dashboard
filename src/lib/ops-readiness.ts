import { db } from "@/lib/db";
import { isAuthConfigured } from "@/lib/auth";
import { trackedSources } from "@/lib/profile";

export type ReadinessStatus = "ready" | "warning" | "blocked";

export type ReadinessCheck = {
  id: string;
  label: string;
  status: ReadinessStatus;
  summary: string;
  detail: string;
};

function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);
}

async function getDatabaseCheck(): Promise<ReadinessCheck> {
  if (!databaseConfigured()) {
    return {
      id: "database",
      label: "Database",
      status: "blocked",
      summary: "Banco ainda nao configurado",
      detail:
        "Defina DATABASE_URL e DIRECT_URL para ligar o Postgres de producao e persistir o radar de forma real.",
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
  return {
    id: "digest",
    label: "Daily digest",
    status: "blocked",
    summary: "Automacao diaria ainda nao ligada",
    detail:
      "A coleta agendada e o email digest matinal ainda precisam ser implementados para fechar o fluxo de operacao automatizada.",
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
