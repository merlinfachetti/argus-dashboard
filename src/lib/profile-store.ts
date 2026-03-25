import { db } from "@/lib/db";
import { deriveCandidateProfile, candidateProfile, type CandidateProfile } from "@/lib/profile";
import { isDatabaseConfigured } from "@/lib/infrastructure";

function arrayFromJson(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : fallback;
}

function mapRecordToCandidateProfile(record: {
  name: string;
  headline: string;
  location: string;
  availability: string | null;
  summary: string;
  languages: unknown;
  coreStack: unknown;
  targetRoles: unknown;
  strengthSignals: unknown;
  cvText: string;
  coverLetterText: string;
}): CandidateProfile {
  return {
    name: record.name,
    headline: record.headline,
    location: record.location,
    availability: record.availability ?? candidateProfile.availability,
    summary: record.summary,
    languages: arrayFromJson(record.languages, candidateProfile.languages),
    coreStack: arrayFromJson(record.coreStack, candidateProfile.coreStack),
    targetRoles: arrayFromJson(record.targetRoles, candidateProfile.targetRoles),
    strengthSignals: arrayFromJson(
      record.strengthSignals,
      candidateProfile.strengthSignals,
    ),
    cvText: record.cvText,
    coverLetterText: record.coverLetterText,
  };
}

export async function ensureCandidateProfileRecord() {
  if (!isDatabaseConfigured()) {
    throw new Error("Banco ainda nao configurado");
  }

  const existing = await db.candidateProfile.findFirst();

  if (existing) {
    return existing;
  }

  return db.candidateProfile.create({
    data: {
      name: candidateProfile.name,
      headline: candidateProfile.headline,
      location: candidateProfile.location,
      availability: candidateProfile.availability,
      summary: candidateProfile.summary,
      languages: candidateProfile.languages,
      coreStack: candidateProfile.coreStack,
      targetRoles: candidateProfile.targetRoles,
      strengthSignals: candidateProfile.strengthSignals,
      cvText: candidateProfile.cvText,
      coverLetterText: candidateProfile.coverLetterText,
    },
  });
}

export async function getPersistedCandidateProfile() {
  if (!isDatabaseConfigured()) {
    return {
      available: false,
      source: "default" as const,
      profile: candidateProfile,
    };
  }

  try {
    const record = await ensureCandidateProfileRecord();

    return {
      available: true,
      source: "database" as const,
      profile: mapRecordToCandidateProfile(record),
    };
  } catch {
    return {
      available: false,
      source: "default" as const,
      profile: candidateProfile,
    };
  }
}

export async function updateCandidateDocuments(input: {
  cvText: string;
  coverLetterText: string;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Banco ainda nao configurado");
  }

  const record = await ensureCandidateProfileRecord();
  const nextProfile = deriveCandidateProfile(candidateProfile, input);

  const updated = await db.candidateProfile.update({
    where: { id: record.id },
    data: {
      name: nextProfile.name,
      headline: nextProfile.headline,
      location: nextProfile.location,
      availability: nextProfile.availability,
      summary: nextProfile.summary,
      languages: nextProfile.languages,
      coreStack: nextProfile.coreStack,
      targetRoles: nextProfile.targetRoles,
      strengthSignals: nextProfile.strengthSignals,
      cvText: nextProfile.cvText,
      coverLetterText: nextProfile.coverLetterText,
    },
  });

  return mapRecordToCandidateProfile(updated);
}

export async function updateCandidateProfile(input: Partial<CandidateProfile>) {
  if (!isDatabaseConfigured()) {
    throw new Error('Banco ainda nao configurado');
  }

  const record = await ensureCandidateProfileRecord();

  const updated = await db.candidateProfile.update({
    where: { id: record.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.headline !== undefined && { headline: input.headline }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.availability !== undefined && { availability: input.availability }),
      ...(input.summary !== undefined && { summary: input.summary }),
      ...(input.languages !== undefined && { languages: input.languages }),
      ...(input.coreStack !== undefined && { coreStack: input.coreStack }),
      ...(input.targetRoles !== undefined && { targetRoles: input.targetRoles }),
      ...(input.cvText !== undefined && { cvText: input.cvText }),
      ...(input.coverLetterText !== undefined && { coverLetterText: input.coverLetterText }),
    },
  });

  return mapRecordToCandidateProfile(updated);
}
