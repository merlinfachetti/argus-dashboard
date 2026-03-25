// tkms.ts — conector para TKMS (thyssenkrupp Marine Systems)
// tkmsgroup.com usa portal corporativo com listagem de vagas

import { withRetry } from "@/lib/connectors/retry";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const SOURCE = "TKMS";
const BASE_URL = "https://www.tkmsgroup.com";

async function fetchTKMSListings(limit = 6): Promise<DiscoveredJobListing[]> {
  // TKMS careers page
  const url = `${BASE_URL}/de/karriere/stellenangebote`;

  const res = await fetch(url, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; ArgusBot/1.0)",
      "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(14000),
  });

  if (!res.ok) throw new Error(`TKMS responded ${res.status}`);

  const html = await res.text();
  const jobs: Array<{ id: string; title: string; url: string; location: string }> = [];

  // Extrair links de vaga do HTML
  const linkMatches = html.matchAll(/href="([^"]*(?:stellen|jobs|career|karriere)[^"]*)"[^>]*>([^<]{5,120})</gi);
  for (const m of linkMatches) {
    const href = m[1];
    const title = m[2].trim().replace(/\s+/g, " ");
    if (!title || title.length < 5) continue;
    const techFilter = /software|engineer|it |security|developer|architect|digital|data|backend|frontend|system|platform|ot |embedded|firmware/i;
    if (!techFilter.test(title)) continue;

    jobs.push({
      id: href.split("/").pop()?.split("?")[0] ?? String(jobs.length),
      title,
      url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
      location: "Hamburg, Germany",
    });
    if (jobs.length >= limit) break;
  }

  return jobs.map((job) => ({
    source: SOURCE,
    externalId: job.id,
    title: job.title,
    company: SOURCE,
    location: job.location,
    family: "Engineering",
    sourceUrl: job.url,
    descriptionText: `${job.title} at TKMS — Hamburg, Germany`,
  }));
}

export async function discoverTKMSJobs(limit = 6): Promise<DiscoveredJobListing[]> {
  const result = await withRetry(SOURCE, () => fetchTKMSListings(limit));
  return result.data ?? [];
}
