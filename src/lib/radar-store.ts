// radar-store.ts — DB persistence layer for the Argus radar
// Uses string literals directly to avoid dependency on Prisma-generated enum types
// (which are not available during Vercel build without a DATABASE_URL).

import { db } from "@/lib/db";
import { trackedSources } from "@/lib/profile";
import { isDatabaseConfigured } from "@/lib/infrastructure";
import { ensureCandidateProfileRecord } from "@/lib/profile-store";
import {
  createHistoryEntry,
  type TrackedJob,
  type UiJobStatus,
  type UiMatchVerdict,
} from "@/lib/radar-types";

// ─── String-literal enum maps ─────────────────────────────────────────────────
// Mirror the Prisma schema enums without importing from @prisma/client.

const STATUS_TO_DB: Record<UiJobStatus, string> = {
  "Nova":                "NEW",
  "Pronta para revisar": "READY_TO_REVIEW",
  "Requer triagem":      "TRIAGE",
  "Aplicar":             "APPLY",
  "Aplicada":            "APPLIED",
  "Entrevista":          "INTERVIEW",
};

const STATUS_FROM_DB: Record<string, UiJobStatus> = {
  NEW:            "Nova",
  READY_TO_REVIEW:"Pronta para revisar",
  TRIAGE:         "Requer triagem",
  APPLY:          "Aplicar",
  APPLIED:        "Aplicada",
  INTERVIEW:      "Entrevista",
  REJECTED:       "Requer triagem",
  ARCHIVED:       "Requer triagem",
};

const VERDICT_TO_DB: Record<UiMatchVerdict, string> = {
  "Alta prioridade": "HIGH_PRIORITY",
  "Boa aderência":   "GOOD_FIT",
  "Aderência parcial":"PARTIAL_FIT",
};

const VERDICT_FROM_DB: Record<string, UiMatchVerdict> = {
  HIGH_PRIORITY:  "Alta prioridade",
  GOOD_FIT:       "Boa aderência",
  PARTIAL_FIT:    "Aderência parcial",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeSourceStatus(status: string): string {
  if (/live/i.test(status))    return "DISCOVERY";
  if (/pausado/i.test(status)) return "PAUSED";
  if (/degrad/i.test(status))  return "DEGRADED";
  return "QUEUED";
}

function normalizeIntakeMode(intakeMode: string): string {
  return /manual/i.test(intakeMode) ? "MANUAL" : "CRAWLER";
}

function arrayFromJson(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTrackedJob(job: any): TrackedJob {
  return {
    id:             job.id,
    title:          job.title,
    company:        job.company,
    location:       job.location ?? "Location not specified",
    seniority:      job.seniority ?? "Not specified",
    workModel:      job.workModel ?? "Not specified",
    employmentType: job.employmentType ?? "Not specified",
    languages:      arrayFromJson(job.languages),
    skills:         arrayFromJson(job.skills),
    summary:        job.summary ?? "",
    score:          job.match?.score ?? 0,
    verdict:        VERDICT_FROM_DB[job.match?.verdict ?? ""] ?? "Aderência parcial",
    status:         STATUS_FROM_DB[job.status] ?? "Nova",
    intakeMode:     job.intakeMode === "MANUAL" ? "Input manual" : `${job.company} crawler`,
    sourceUrl:      job.sourceUrl ?? undefined,
    externalId:     job.externalId ?? undefined,
    family:         undefined,
    createdAt:      job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
    updatedAt:      job.updatedAt instanceof Date ? job.updatedAt.toISOString() : job.updatedAt,
    history:
      job.statusEvents?.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? job.statusEvents.map((entry: any) => ({
            status:    STATUS_FROM_DB[entry.status] ?? "Nova",
            changedAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
            note:      entry.note ?? undefined,
          }))
        : [createHistoryEntry(STATUS_FROM_DB[job.status] ?? "Nova",
            job.updatedAt instanceof Date ? job.updatedAt.toISOString() : job.updatedAt)],
    strengths:       arrayFromJson(job.match?.strengths),
    risks:           arrayFromJson(job.match?.risks),
    recruiterMessage:job.match?.recruiterMessage ?? undefined,
  };
}

// ─── Source sync ──────────────────────────────────────────────────────────────

async function ensureSources() {
  await Promise.all(
    trackedSources.map((source) =>
      db.jobSource.upsert({
        where:  { slug: slugify(source.company) },
        update: {
          company:      source.company,
          baseUrl:      source.url,
          discoveryUrl: source.url,
          strategy:     source.strategy,
          status:       normalizeSourceStatus(source.status),
        },
        create: {
          company:      source.company,
          slug:         slugify(source.company),
          baseUrl:      source.url,
          discoveryUrl: source.url,
          strategy:     source.strategy,
          status:       normalizeSourceStatus(source.status),
        },
      }),
    ),
  );
}

async function getSourceIdForJob(job: TrackedJob) {
  if (/manual/i.test(job.intakeMode)) return null;
  const source = await db.jobSource.findUnique({
    where:  { slug: slugify(job.company) },
    select: { id: true },
  });
  return source?.id ?? null;
}

async function createStatusEventIfNeeded(jobId: string, dbStatus: string, note?: string) {
  const latestEvent = await db.jobStatusEvent.findFirst({
    where:   { jobId },
    orderBy: { createdAt: "desc" },
  });
  if (latestEvent?.status === dbStatus) return;
  await db.jobStatusEvent.create({ data: { jobId, status: dbStatus, note } });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchRadarJobs() {
  if (!isDatabaseConfigured()) {
    return { available: false, reason: "Database not configured", jobs: [] as TrackedJob[] };
  }

  try {
    await ensureSources();
    await ensureCandidateProfileRecord();

    const jobs = await db.jobPosting.findMany({
      include: {
        match: true,
        statusEvents: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
      take:    50,
    });

    return { available: true, reason: null, jobs: jobs.map(mapTrackedJob) };
  } catch (err) {
    return {
      available: false,
      reason: err instanceof Error ? err.message : "DB error",
      jobs: [] as TrackedJob[],
    };
  }
}

export async function persistRadarJob(job: TrackedJob, rawDescription?: string) {
  if (!isDatabaseConfigured()) throw new Error("Database not configured");

  await ensureSources();
  const profile  = await ensureCandidateProfileRecord();
  const sourceId = await getSourceIdForJob(job);
  const dbStatus = STATUS_TO_DB[job.status] ?? "NEW";

  const postingData = {
    intakeMode:           normalizeIntakeMode(job.intakeMode),
    sourceUrl:            job.sourceUrl,
    title:                job.title,
    company:              job.company,
    location:             job.location,
    seniority:            job.seniority,
    workModel:            job.workModel,
    employmentType:       job.employmentType,
    languages:            job.languages,
    skills:               job.skills,
    summary:              job.summary,
    descriptionRaw:       rawDescription ?? job.summary,
    descriptionNormalized:rawDescription ?? job.summary,
    status:               dbStatus,
  };

  let posting;
  if (sourceId && job.externalId) {
    posting = await db.jobPosting.upsert({
      where:  { sourceId_externalId: { sourceId, externalId: job.externalId } },
      update: postingData,
      create: { ...postingData, sourceId, externalId: job.externalId },
    });
  } else {
    posting = await db.jobPosting.create({
      data: { ...postingData, sourceId, externalId: job.externalId },
    });
  }

  await db.jobMatch.upsert({
    where:  { jobId: posting.id },
    update: {
      candidateProfileId: profile.id,
      score:              job.score,
      verdict:            VERDICT_TO_DB[job.verdict] ?? "PARTIAL_FIT",
      strengths:          job.strengths ?? [],
      risks:              job.risks ?? [],
      recruiterMessage:   job.recruiterMessage ?? null,
    },
    create: {
      candidateProfileId: profile.id,
      jobId:              posting.id,
      score:              job.score,
      verdict:            VERDICT_TO_DB[job.verdict] ?? "PARTIAL_FIT",
      strengths:          job.strengths ?? [],
      risks:              job.risks ?? [],
      recruiterMessage:   job.recruiterMessage ?? null,
    },
  });

  await createStatusEventIfNeeded(posting.id, dbStatus);

  const persisted = await db.jobPosting.findUniqueOrThrow({
    where:   { id: posting.id },
    include: { match: true, statusEvents: { orderBy: { createdAt: "desc" } } },
  });

  return mapTrackedJob(persisted);
}

export async function updateRadarJobStatus(jobId: string, status: UiJobStatus) {
  if (!isDatabaseConfigured()) throw new Error("Database not configured");

  const dbStatus = STATUS_TO_DB[status] ?? "NEW";

  await db.jobPosting.update({
    where: { id: jobId },
    data:  { status: dbStatus },
  });

  await createStatusEventIfNeeded(jobId, dbStatus);

  const refreshed = await db.jobPosting.findUniqueOrThrow({
    where:   { id: jobId },
    include: { match: true, statusEvents: { orderBy: { createdAt: "desc" } } },
  });

  return mapTrackedJob(refreshed);
}
