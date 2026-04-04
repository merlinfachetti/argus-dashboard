import type { ParsedJob } from "@/lib/job-intake";

export const STATUS_OPTIONS = [
  "Nova",
  "Pronta para revisar",
  "Requer triagem",
  "Aplicar",
  "Aplicada",
  "Entrevista",
] as const;

export const DASHBOARD_STATUS_LANES = [
  "Nova",
  "Pronta para revisar",
  "Aplicar",
  "Aplicada",
  "Entrevista",
] as const;

export type UiJobStatus = (typeof STATUS_OPTIONS)[number];
export type UiMatchVerdict =
  | "Alta prioridade"
  | "Boa aderência"
  | "Aderência parcial";

export type JobHistoryEntry = {
  status: UiJobStatus;
  changedAt: string;
  note?: string;
};

export type TrackedJob = ParsedJob & {
  id: string;
  score: number;
  verdict: UiMatchVerdict;
  status: UiJobStatus;
  intakeMode: string;
  sourceUrl?: string;
  externalId?: string;
  family?: string;
  createdAt?: string;
  updatedAt?: string;
  history: JobHistoryEntry[];
  // Match detail — persistido no DB e restaurado
  strengths?: string[];
  risks?: string[];
  recruiterMessage?: string;
};

export function createHistoryEntry(
  status: UiJobStatus,
  changedAt = new Date().toISOString(),
): JobHistoryEntry {
  return {
    status,
    changedAt,
  };
}

// ─── i18n display mapping ─────────────────────────────────────────────────────
// DB values are in PT-BR. These functions map them to translated display strings.
// The `t` parameter is the translation function from useT() or t(key, lang).

const STATUS_I18N_MAP: Record<UiJobStatus, string> = {
  "Nova":                "status.nova",
  "Pronta para revisar": "status.prontaParaRevisar",
  "Requer triagem":      "status.requerTriagem",
  "Aplicar":             "status.aplicar",
  "Aplicada":            "status.aplicada",
  "Entrevista":          "status.entrevista",
};

const VERDICT_I18N_MAP: Record<UiMatchVerdict, string> = {
  "Alta prioridade":   "verdict.highPriority",
  "Boa aderência":     "verdict.goodMatch",
  "Aderência parcial": "verdict.partialMatch",
};

/** Translate a persisted status value for display. */
export function statusToDisplay(status: UiJobStatus, t: (key: string) => string): string {
  const key = STATUS_I18N_MAP[status];
  return key ? t(key) : status;
}

/** Translate a persisted verdict value for display. */
export function verdictToDisplay(verdict: UiMatchVerdict, t: (key: string) => string): string {
  const key = VERDICT_I18N_MAP[verdict];
  return key ? t(key) : verdict;
}
