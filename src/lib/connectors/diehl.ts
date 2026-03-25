// diehl.ts — conector para Diehl Careers (diehl.com/career)
// Diehl usa seu próprio ATS com listagem pública

import { withRetry } from "@/lib/connectors/retry";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const SOURCE = "Diehl";
const BASE_URL = "https://www.diehl.com";

type DiehlJob = {
  id?: string;
  title?: string;
  location?: string;
  department?: string;
  url?: string;
  description?: string;
};

async function fetchDiehlListings(limit = 6): Promise<DiscoveredJobListing[]> {
  const listUrl = `${BASE_URL}/career/en/jobs-application/job-offers/`;

  const res = await fetch(listUrl, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; ArgusBot/1.0)",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(14000),
  });

  if (!res.ok) throw new Error(`Diehl responded ${res.status}`);

  const html = await res.text();

  // Parsear vagas do HTML — Diehl lista vagas como itens de tabela/lista
  const jobs: DiehlJob[] = [];

  // Tentar extrair JSON embutido
  const jsonMatch = html.match(/var\s+jobs\s*=\s*(\[[\s\S]+?\]);/) ||
                    html.match(/"jobPostings"\s*:\s*(\[[\s\S]{10,3000}?\])/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]) as DiehlJob[];
      jobs.push(...parsed);
    } catch { /* fallback */ }
  }

  if (jobs.length === 0) {
    // Fallback: regex no HTML para links de vagas
    const linkMatches = html.matchAll(/href="([^"]*job[^"]*)"[^>]*>\s*([^<]{5,100})</gi);
    for (const m of linkMatches) {
      const href = m[1];
      const title = m[2].trim();
      if (title && !title.includes("http") && /engineer|software|it |security|developer|manager/i.test(title)) {
        jobs.push({
          id: href.split("/").pop() ?? String(jobs.length),
          title,
          url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
          location: "Germany",
          department: "Engineering",
        });
        if (jobs.length >= limit) break;
      }
    }
  }

  // Filtrar roles técnicos
  const techFilter = /software|engineer|developer|security|cloud|devops|it |data|backend|embedded|firmware|platform|architect/i;
  const filtered = jobs.filter((j) => techFilter.test(j.title ?? ""));

  return filtered.slice(0, limit).map((job): DiscoveredJobListing => {
    const id = String(job.id ?? Math.random().toString(36).slice(2));
    const title = job.title ?? "Diehl Position";
    const url = job.url ?? `${BASE_URL}/career/en/jobs-application/job-offers/`;

    return {
      source: SOURCE,
      externalId: id,
      title,
      company: SOURCE,
      location: job.location ?? "Germany",
      family: job.department ?? "Engineering",
      sourceUrl: url,
      descriptionText: job.description ?? `${title} at Diehl — Germany`,
    };
  });
}

export async function discoverDiehlJobs(limit = 6): Promise<DiscoveredJobListing[]> {
  const result = await withRetry(SOURCE, () => fetchDiehlListings(limit));
  return result.data ?? [];
}
