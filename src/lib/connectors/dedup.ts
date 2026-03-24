// dedup.ts — deduplicação robusta de vagas no radar
// Combina externalId + hash de título+empresa para evitar duplicatas

import type { TrackedJob } from "@/lib/radar-types";

export function jobFingerprint(title: string, company: string): string {
  const normalized = `${company}:${title}`
    .toLowerCase()
    .replace(/[^a-z0-9:]/g, "")
    .slice(0, 80);
  return normalized;
}

export function deduplicateJobs(
  incoming: TrackedJob[],
  existing: TrackedJob[],
): { additions: TrackedJob[]; duplicates: TrackedJob[] } {
  const seenExternalIds = new Set(
    existing.map((j) => j.externalId).filter(Boolean)
  );
  const seenFingerprints = new Set(
    existing.map((j) => jobFingerprint(j.title, j.company))
  );

  const additions: TrackedJob[] = [];
  const duplicates: TrackedJob[] = [];

  for (const job of incoming) {
    const isDupById = job.externalId && seenExternalIds.has(job.externalId);
    const isDupByFingerprint = seenFingerprints.has(
      jobFingerprint(job.title, job.company)
    );

    if (isDupById || isDupByFingerprint) {
      duplicates.push(job);
    } else {
      additions.push(job);
      if (job.externalId) seenExternalIds.add(job.externalId);
      seenFingerprints.add(jobFingerprint(job.title, job.company));
    }
  }

  return { additions, duplicates };
}
