-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('CAREER_SITE', 'MANUAL');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('DISCOVERY', 'READY', 'DEGRADED', 'PAUSED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('NEW', 'READY_TO_REVIEW', 'TRIAGE', 'APPLY', 'APPLIED', 'INTERVIEW', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MatchVerdict" AS ENUM ('HIGH_PRIORITY', 'GOOD_FIT', 'PARTIAL_FIT');

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "availability" TEXT,
    "summary" TEXT NOT NULL,
    "languages" JSONB NOT NULL,
    "coreStack" JSONB NOT NULL,
    "targetRoles" JSONB NOT NULL,
    "strengthSignals" JSONB NOT NULL,
    "cvText" TEXT NOT NULL,
    "coverLetterText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSource" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "discoveryUrl" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "status" "SourceStatus" NOT NULL DEFAULT 'DISCOVERY',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "externalId" TEXT,
    "intakeMode" "SourceKind" NOT NULL,
    "sourceUrl" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "workModel" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "languages" JSONB NOT NULL,
    "skills" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "descriptionRaw" TEXT NOT NULL,
    "descriptionNormalized" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatch" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "verdict" "MatchVerdict" NOT NULL,
    "strengths" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "recruiterMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobStatusEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyDigest" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "digestDate" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyDigest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobSource_slug_key" ON "JobSource"("slug");

-- CreateIndex
CREATE INDEX "JobPosting_company_createdAt_idx" ON "JobPosting"("company", "createdAt");

-- CreateIndex
CREATE INDEX "JobPosting_status_createdAt_idx" ON "JobPosting"("status", "createdAt");

-- CreateIndex
CREATE INDEX "JobPosting_sourceId_createdAt_idx" ON "JobPosting"("sourceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_sourceId_externalId_key" ON "JobPosting"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_jobId_key" ON "JobMatch"("jobId");

-- CreateIndex
CREATE INDEX "JobMatch_candidateProfileId_score_idx" ON "JobMatch"("candidateProfileId", "score");

-- CreateIndex
CREATE INDEX "JobStatusEvent_jobId_createdAt_idx" ON "JobStatusEvent"("jobId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyDigest_candidateProfileId_digestDate_key" ON "DailyDigest"("candidateProfileId", "digestDate");

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "JobSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobStatusEvent" ADD CONSTRAINT "JobStatusEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyDigest" ADD CONSTRAINT "DailyDigest_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
