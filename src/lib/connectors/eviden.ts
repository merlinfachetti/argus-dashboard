// eviden.ts — conector para Eviden Careers (eviden.com/careers)
// Eviden (ex-Atos) usa SmartRecruiters como ATS — tem API pública

import { withRetry } from "@/lib/connectors/retry";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const SOURCE = "Eviden";
const API_BASE = "https://eviden.com";

type EvidenJob = {
  id?: string;
  uuid?: string;
  name?: string;
  title?: string;
  location?: { city?: string; country?: string; countryCode?: string; region?: string };
  department?: { label?: string };
  jobAd?: { sections?: Array<{ title?: string; description?: string }> };
  refNumber?: string;
  applyUrl?: string;
};

type EvidenResponse = {
  content?: EvidenJob[];
  items?: EvidenJob[];
  total?: number;
};

async function fetchEvidenListings(limit = 6): Promise<DiscoveredJobListing[]> {
  // SmartRecruiters API para Eviden
  const apiUrl = "https://api.smartrecruiters.com/v1/companies/eviden/postings?limit=30&offset=0&country=de&department=it";

  const res = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; ArgusBot/1.0)",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`Eviden API responded ${res.status}`);

  const data = (await res.json()) as EvidenResponse;
  const jobs = data.content ?? data.items ?? [];

  const techKeywords = /software|engineer|developer|security|cloud|devops|architect|technical|data|backend|frontend|full.?stack|platform|cyber/i;

  const filtered = jobs.filter((j) => techKeywords.test(j.name ?? j.title ?? ""));

  return filtered.slice(0, limit).map((job): DiscoveredJobListing => {
    const id = String(job.id ?? job.uuid ?? job.refNumber ?? Math.random().toString(36).slice(2));
    const title = job.name ?? job.title ?? "Eviden Position";
    const loc = [job.location?.city, job.location?.country].filter(Boolean).join(", ") || "Germany";
    const family = job.department?.label ?? "Engineering";
    const url = job.applyUrl ?? `${API_BASE}/careers/`;
    const desc = job.jobAd?.sections?.map((s) => s.description ?? "").join(" ").replace(/<[^>]+>/g, " ").trim().slice(0, 500) ?? "";

    return {
      source: SOURCE,
      externalId: id,
      title,
      company: SOURCE,
      location: loc,
      family,
      sourceUrl: url,
      descriptionText: desc || `${title} at Eviden — ${loc}`,
    };
  });
}

export async function discoverEvidenJobs(limit = 6): Promise<DiscoveredJobListing[]> {
  const result = await withRetry(SOURCE, () => fetchEvidenListings(limit));
  return result.data ?? [];
}
