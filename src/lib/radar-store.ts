import {
  JobStatus,
  MatchVerdict,
  SourceKind,
  SourceStatus,
  type Prisma,
} from "@prisma/client";
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

const statusToDb: Record<UiJobStatus, JobStatus> = {
  Nova: JobStatus.NEW,
  "Pronta para revisar": JobStatus.READY_TO_REVIEW,
  "Requer triagem": JobStatus.TRIAGE,
  Aplicar: JobStatus.APPLY,
  Aplicada: JobStatus.APPLIED,
  Entrevista: JobStatus.INTERVIEW,
};

const statusFromDb: Record<JobStatus, UiJobStatus> = {
  [JobStatus.NEW]: "Nova",
  [JobStatus.READY_TO_REVIEW]: "Pronta para revisar",
  [JobStatus.TRIAGE]: "Requer triagem",
  [JobStatus.APPLY]: "Aplicar",
  [JobStatus.APPLIED]: "Aplicada",
  [JobStatus.INTERVIEW]: "Entrevista",
  [JobStatus.REJECTED]: "Requer triagem",
  [JobStatus.ARCHIVED]: "Requer triagem",
};

const verdictToDb: Record<UiMatchVerdict, MatchVerdict> = {
  "Alta prioridade": MatchVerdict.HIGH_PRIORITY,
  "Boa aderência": MatchVerdict.GOOD_FIT,
  "Aderência parcial": MatchVerdict.PARTIAL_FIT,
};

const verdictFromDb: Record<MatchVerdict, UiMatchVerdict> = {
  [MatchVerdict.HIGH_PRIORITY]: "Alta prioridade",
  [MatchVerdict.GOOD_FIT]: "Boa aderência",
  [MatchVerdict.PARTIAL_FIT]: "Aderência parcial",
};

type JobWithRelations = Prisma.JobPostingGetPayload<{
  include: {
    match: true;
    statusEvents: {
      orderBy: {
        createdAt: "desc";
      };
    };
  };
}>;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSourceStatus(status: string) {
  if (/pronto/i.test(status)) {
    return SourceStatus.READY;
  }

  if (/pausado/i.test(status)) {
    return SourceStatus.PAUSED;
  }

  if (/degrad/i.test(status)) {
    return SourceStatus.DEGRADED;
  }

  return SourceStatus.DISCOVERY;
}

function mapTrackedJob(job: JobWithRelations): TrackedJob {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    seniority: job.seniority,
    workModel: job.workModel,
    employmentType: job.employmentType,
    languages: (job.languages as string[]) ?? [],
    skills: (job.skills as string[]) ?? [],
    summary: job.summary,
    score: job.match?.score ?? 0,
    verdict: job.match?.verdict
      ? verdictFromDb[job.match.verdict]
      : "Aderência parcial",
    status: statusFromDb[job.status],
    intakeMode:
      job.intakeMode === SourceKind.MANUAL ? "Input manual" : `${job.company} crawler`,
    sourceUrl: job.sourceUrl ?? undefined,
    externalId: job.externalId ?? undefined,
    family: undefined,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    history:
      job.statusEvents.length > 0
        ? job.statusEvents.map((entry) => ({
            status: statusFromDb[entry.status],
            changedAt: entry.createdAt.toISOString(),
            note: entry.note ?? undefined,
          }))
        : [createHistoryEntry(statusFromDb[job.status], job.updatedAt.toISOString())],
  };
}

async function ensureSources() {
  await Promise.all(
    trackedSources.map((source) =>
      db.jobSource.upsert({
        where: { slug: slugify(source.company) },
        update: {
          company: source.company,
          baseUrl: source.url,
          discoveryUrl: source.url,
          strategy: source.strategy,
          status: normalizeSourceStatus(source.status),
        },
        create: {
          company: source.company,
          slug: slugify(source.company),
          baseUrl: source.url,
          discoveryUrl: source.url,
          strategy: source.strategy,
          status: normalizeSourceStatus(source.status),
        },
      }),
    ),
  );
}

async function getSourceIdForJob(job: TrackedJob) {
  if (/manual/i.test(job.intakeMode)) {
    return null;
  }

  const slug = slugify(job.company);
  const source = await db.jobSource.findUnique({
    where: { slug },
    select: { id: true },
  });

  return source?.id ?? null;
}

async function createStatusEventIfNeeded(jobId: string, status: JobStatus, note?: string) {
  const latestEvent = await db.jobStatusEvent.findFirst({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });

  if (latestEvent?.status === status) {
    return;
  }

  await db.jobStatusEvent.create({
    data: {
      jobId,
      status,
      note,
    },
  });
}

function buildPostingData(job: TrackedJob, rawDescription?: string) {
  return {
    intakeMode: /manual/i.test(job.intakeMode)
      ? SourceKind.MANUAL
      : SourceKind.CAREER_SITE,
    sourceUrl: job.sourceUrl,
    title: job.title,
    company: job.company,
    location: job.location,
    seniority: job.seniority,
    workModel: job.workModel,
    employmentType: job.employmentType,
    languages: job.languages,
    skills: job.skills,
    summary: job.summary,
    descriptionRaw: rawDescription ?? job.summary,
    descriptionNormalized: rawDescription ?? job.summary,
    status: statusToDb[job.status],
  } satisfies Omit<
    Prisma.JobPostingUncheckedCreateInput,
    "id" | "sourceId" | "externalId"
  >;
}

export async function fetchRadarJobs() {
  if (!isDatabaseConfigured()) {
    return {
      available: false,
      reason: "Banco ainda não configurado",
      jobs: [] as TrackedJob[],
    };
  }

  await ensureSources();
  await ensureCandidateProfileRecord();

  const jobs = await db.jobPosting.findMany({
    include: {
      match: true,
      statusEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return {
    available: true,
    reason: null,
    jobs: jobs.map(mapTrackedJob),
  };
}

export async function persistRadarJob(job: TrackedJob, rawDescription?: string) {
  if (!isDatabaseConfigured()) {
    throw new Error("Banco ainda não configurado");
  }

  await ensureSources();
  const profile = await ensureCandidateProfileRecord();
  const sourceId = await getSourceIdForJob(job);
  const postingData = buildPostingData(job, rawDescription);

  let posting;

  if (sourceId && job.externalId) {
    posting = await db.jobPosting.upsert({
      where: {
        sourceId_externalId: {
          sourceId,
          externalId: job.externalId,
        },
      },
      update: postingData,
      create: {
        ...postingData,
        sourceId,
        externalId: job.externalId,
      },
    });
  } else {
    posting = await db.jobPosting.create({
      data: {
        ...postingData,
        sourceId,
        externalId: job.externalId,
      },
    });
  }

  await db.jobMatch.upsert({
    where: { jobId: posting.id },
    update: {
      candidateProfileId: profile.id,
      score: job.score,
      verdict: verdictToDb[job.verdict],
      strengths: [],
      risks: [],
    },
    create: {
      candidateProfileId: profile.id,
      jobId: posting.id,
      score: job.score,
      verdict: verdictToDb[job.verdict],
      strengths: [],
      risks: [],
      recruiterMessage: null,
    },
  });

  await createStatusEventIfNeeded(posting.id, statusToDb[job.status]);

  const persisted = await db.jobPosting.findUniqueOrThrow({
    where: { id: posting.id },
    include: {
      match: true,
      statusEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return mapTrackedJob(persisted);
}

export async function updateRadarJobStatus(jobId: string, status: UiJobStatus) {
  if (!isDatabaseConfigured()) {
    throw new Error("Banco ainda não configurado");
  }

  await db.jobPosting.update({
    where: { id: jobId },
    data: {
      status: statusToDb[status],
    },
    include: {
      match: true,
      statusEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  await createStatusEventIfNeeded(jobId, statusToDb[status]);

  const refreshed = await db.jobPosting.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      match: true,
      statusEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return mapTrackedJob(refreshed);
}
