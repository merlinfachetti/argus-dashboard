// sap.ts — conector para SAP Careers (jobs.sap.com)
// SAP usa Greenhouse com API pública documentada

import { withRetry } from "@/lib/connectors/retry";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const SOURCE = "SAP";
const API_BASE = "https://jobs.sap.com";

type SAPJob = {
  id?: string | number;
  title?: string;
  location?: {
    name?: string;
    city?: string;
    country_id?: string;
    country?: string;
  };
  departments?: Array<{ name?: string }>;
  metadata?: Array<{ name?: string; value?: string | null }>;
  absolute_url?: string;
  content?: string;
};

type SAPResponse = {
  jobs?: SAPJob[];
};

async function fetchSAPListings(limit = 6): Promise<DiscoveredJobListing[]> {
  // SAP Greenhouse API — filtrando por Alemanha
  const apiUrl = `${API_BASE}/api/v1/boards/sap/jobs?content=true`;

  const res = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; ArgusBot/1.0)",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`SAP API responded ${res.status}`);

  const data = (await res.json()) as SAPResponse;
  const jobs = data.jobs ?? [];

  // Filtrar por Germany e roles técnicos relevantes
  const techKeywords = /software|engineer|developer|security|devops|cloud|architect|technical|it |data|backend|frontend|full.?stack|embedded|firmware|platform/i;
  const germanyKeywords = /germany|deutschland|DE\b|munich|münchen|berlin|hamburg|frankfurt|walldorf|heidelberg|düsseldorf|cologne|köln/i;

  const filtered = jobs.filter((job) => {
    const loc = [
      job.location?.name,
      job.location?.city,
      job.location?.country,
      job.location?.country_id,
    ].join(" ");

    const title = job.title ?? "";
    return germanyKeywords.test(loc) && techKeywords.test(title);
  });

  return filtered.slice(0, limit).map((job): DiscoveredJobListing => {
    const id = String(job.id ?? Math.random().toString(36).slice(2));
    const title = job.title ?? "SAP Position";
    const loc = job.location?.name ?? job.location?.city ?? "Germany";
    const family = job.departments?.[0]?.name ?? "Engineering";
    const url = job.absolute_url ?? `${API_BASE}/search/?q=${encodeURIComponent(title)}`;

    // Extrair texto da descrição removendo HTML
    const desc = (job.content ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 600);

    return {
      source: SOURCE,
      externalId: id,
      title,
      company: SOURCE,
      location: loc,
      family,
      sourceUrl: url,
      descriptionText: desc || `${title} at SAP — ${loc}`,
    };
  });
}

export async function discoverSAPJobs(limit = 6): Promise<DiscoveredJobListing[]> {
  const result = await withRetry(SOURCE, () => fetchSAPListings(limit));
  return result.data ?? [];
}
