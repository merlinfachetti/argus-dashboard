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
