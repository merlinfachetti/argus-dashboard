// ─── Pipeline analytics ────────────────────────────────────────────────────────
// Calcula métricas históricas do radar local para orientar decisões de prioridade.

import type { TrackedJob } from "@/lib/radar-types";

export type FunnelStep = {
  status: string;
  count: number;
  pct: number; // % do total de vagas
};

export type ScoreBucket = {
  label: string;       // "90–97", "78–89", etc.
  min: number;
  max: number;
  count: number;
  applied: number;     // quantas viraram candidatura
  conversion: number;  // % de conversão
};

export type SourceStat = {
  source: string;
  count: number;
  avgScore: number;
  applied: number;
};

export type TimelineStat = {
  week: string;        // "2026-W12"
  added: number;
  applied: number;
};

export type PipelineAnalytics = {
  totalJobs: number;
  appliedJobs: number;
  interviewJobs: number;
  avgScore: number;
  topScore: number;
  applyRate: number;           // applied / total
  interviewRate: number;       // interviews / applied
  avgDaysToApply: number | null;
  funnel: FunnelStep[];
  scoreBuckets: ScoreBucket[];
  sourceStats: SourceStat[];
  timelineStats: TimelineStat[];
  stalledJobs: TrackedJob[];   // vagas paradas há >14 dias
  readyToApply: TrackedJob[];  // score ≥70, status = Aplicar
};

function isoWeek(dateStr: string): string {
  const d   = new Date(dateStr);
  const jan = new Date(d.getFullYear(), 0, 1);
  const wk  = Math.ceil(((d.getTime() - jan.getTime()) / 86400000 + jan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(wk).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000;
}

const SCORE_BUCKETS: Array<[string, number, number]> = [
  ["90–97", 90, 97],
  ["78–89", 78, 89],
  ["62–77", 62, 77],
  ["32–61", 32, 61],
];

const STATUS_ORDER = [
  "Nova",
  "Requer triagem",
  "Pronta para revisar",
  "Aplicar",
  "Aplicada",
  "Entrevista",
];

export function computePipelineAnalytics(jobs: TrackedJob[]): PipelineAnalytics {
  if (jobs.length === 0) {
    return {
      totalJobs: 0, appliedJobs: 0, interviewJobs: 0,
      avgScore: 0, topScore: 0, applyRate: 0, interviewRate: 0,
      avgDaysToApply: null,
      funnel: [], scoreBuckets: [], sourceStats: [], timelineStats: [],
      stalledJobs: [], readyToApply: [],
    };
  }

  const totalJobs     = jobs.length;
  const appliedJobs   = jobs.filter((j) => j.status === "Aplicada" || j.status === "Entrevista").length;
  const interviewJobs = jobs.filter((j) => j.status === "Entrevista").length;
  const avgScore      = Math.round(jobs.reduce((s, j) => s + j.score, 0) / totalJobs);
  const topScore      = Math.max(...jobs.map((j) => j.score));
  const applyRate     = totalJobs > 0 ? Math.round((appliedJobs / totalJobs) * 100) : 0;
  const interviewRate = appliedJobs > 0 ? Math.round((interviewJobs / appliedJobs) * 100) : 0;

  // Avg days from Nova → Aplicada
  const daysToApply: number[] = [];
  for (const job of jobs) {
    const novaEntry    = job.history.find((h) => h.status === "Nova");
    const appliedEntry = job.history.find((h) => h.status === "Aplicada");
    if (novaEntry && appliedEntry) {
      daysToApply.push(daysBetween(novaEntry.changedAt, appliedEntry.changedAt));
    }
  }
  const avgDaysToApply = daysToApply.length > 0
    ? Math.round(daysToApply.reduce((s, d) => s + d, 0) / daysToApply.length)
    : null;

  // Funnel
  const funnel: FunnelStep[] = STATUS_ORDER.map((status) => {
    const count = jobs.filter((j) => j.status === status).length;
    return { status, count, pct: Math.round((count / totalJobs) * 100) };
  }).filter((s) => s.count > 0);

  // Score buckets
  const scoreBuckets: ScoreBucket[] = SCORE_BUCKETS.map(([label, min, max]) => {
    const bucket  = jobs.filter((j) => j.score >= min && j.score <= max);
    const applied = bucket.filter((j) => j.status === "Aplicada" || j.status === "Entrevista").length;
    return {
      label, min, max,
      count: bucket.length,
      applied,
      conversion: bucket.length > 0 ? Math.round((applied / bucket.length) * 100) : 0,
    };
  }).filter((b) => b.count > 0);

  // Source stats
  const sourceMap = new Map<string, TrackedJob[]>();
  for (const job of jobs) {
    const src = /crawler/i.test(job.intakeMode)
      ? job.company
      : "Manual intake";
    if (!sourceMap.has(src)) sourceMap.set(src, []);
    sourceMap.get(src)!.push(job);
  }
  const sourceStats: SourceStat[] = [...sourceMap.entries()].map(([source, sjobs]) => ({
    source,
    count: sjobs.length,
    avgScore: Math.round(sjobs.reduce((s, j) => s + j.score, 0) / sjobs.length),
    applied: sjobs.filter((j) => j.status === "Aplicada" || j.status === "Entrevista").length,
  })).sort((a, b) => b.count - a.count);

  // Timeline (últimas 8 semanas)
  const timelineMap = new Map<string, { added: number; applied: number }>();
  for (const job of jobs) {
    if (!job.createdAt) continue;
    const wk = isoWeek(job.createdAt);
    if (!timelineMap.has(wk)) timelineMap.set(wk, { added: 0, applied: 0 });
    timelineMap.get(wk)!.added++;
    if (job.status === "Aplicada" || job.status === "Entrevista") {
      timelineMap.get(wk)!.applied++;
    }
  }
  const timelineStats: TimelineStat[] = [...timelineMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, v]) => ({ week, ...v }));

  // Stalled jobs: paradas há >14 dias em status não-final
  const now   = Date.now();
  const stale = ["Nova", "Pronta para revisar", "Requer triagem", "Aplicar"];
  const stalledJobs = jobs.filter((j) => {
    if (!stale.includes(j.status)) return false;
    const ref = j.updatedAt ?? j.createdAt;
    if (!ref) return false;
    return (now - new Date(ref).getTime()) / 86400000 > 14;
  });

  // Ready to apply: score ≥70 + status Aplicar
  const readyToApply = jobs
    .filter((j) => j.score >= 70 && j.status === "Aplicar")
    .sort((a, b) => b.score - a.score);

  return {
    totalJobs, appliedJobs, interviewJobs,
    avgScore, topScore, applyRate, interviewRate, avgDaysToApply,
    funnel, scoreBuckets, sourceStats, timelineStats,
    stalledJobs, readyToApply,
  };
}
