// bayer.ts — conector para Bayer Careers (talent.bayer.com)
// Usa a API pública de busca de vagas do Bayer

import { withRetry } from "@/lib/connectors/retry";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const BASE_URL = "https://talent.bayer.com";
const SOURCE = "Bayer";

type BayerJob = {
  jobId?: string;
  id?: string;
  jobTitle?: string;
  title?: string;
  country?: string;
  city?: string;
  location?: string;
  jobFamily?: string;
  category?: string;
  jobPostingId?: string;
  applyLink?: string;
  url?: string;
  description?: string;
};

async function fetchBayerListings(limit = 6): Promise<DiscoveredJobListing[]> {
  // Bayer usa Phenom People — API de busca pública
  const searchUrl = `${BASE_URL}/careers?pid=562949956234521&job%20type=professional&domain=bayer.com`;

  const res = await fetch(searchUrl, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; ArgusBot/1.0)",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`Bayer responded ${res.status}`);

  const html = await res.text();

  // Tentar extrair jobs do JSON embutido na página
  const jsonMatch = html.match(/window\.__phenom_jobs\s*=\s*(\[[\s\S]+?\]);/) ||
                    html.match(/"jobs"\s*:\s*(\[[\s\S]{20,2000}?\])/);

  let jobs: BayerJob[] = [];

  if (jsonMatch) {
    try {
      jobs = JSON.parse(jsonMatch[1]) as BayerJob[];
    } catch {
      // Fallback: parsear links de vaga do HTML
    }
  }

  if (jobs.length === 0) {
    // Fallback: extrair links e títulos do HTML
    const titleMatches = html.matchAll(/data-job-title="([^"]+)"[^>]*data-job-id="([^"]+)"/g);
    for (const m of titleMatches) {
      jobs.push({ title: m[1], id: m[2] });
      if (jobs.length >= limit) break;
    }
  }

  return jobs.slice(0, limit).map((job): DiscoveredJobListing => {
    const id = String(job.jobId ?? job.id ?? job.jobPostingId ?? Math.random().toString(36).slice(2));
    const title = job.jobTitle ?? job.title ?? "Untitled Position";
    const loc = [job.city, job.country].filter(Boolean).join(", ") || job.location || "Germany";
    const family = job.jobFamily ?? job.category ?? "Engineering";
    const url = job.applyLink ?? job.url ?? `${BASE_URL}/careers?pid=562949956234521`;

    return {
      source: SOURCE,
      externalId: id,
      title,
      company: SOURCE,
      location: loc,
      family,
      sourceUrl: url,
      descriptionText: job.description ?? `${title} at Bayer — ${loc}`,
    };
  });
}

export async function discoverBayerJobs(limit = 6): Promise<DiscoveredJobListing[]> {
  const result = await withRetry(SOURCE, () => fetchBayerListings(limit));
  return result.data ?? [];
}
