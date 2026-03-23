import * as cheerio from "cheerio";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const AIRBUS_SEARCH_URL =
  "https://www.airbus.com/en/careers/search-and-apply?country=Germany";

function cleanText(v: string) {
  return v.replace(/\s+/g, " ").trim();
}

function buildDescriptionText({
  title,
  location,
  family,
  sourceUrl,
}: {
  title: string;
  location: string;
  family: string;
  sourceUrl: string;
}) {
  const isSoftware = /software|developer|engineer|entwickler|digital|it |platform|devops|architect|data|systems/i.test(title + " " + family);
  const isSenior   = /senior|lead|principal|expert/i.test(title);

  const skills: string[] = [];
  if (isSoftware) skills.push("Software engineering", "TypeScript", "Python", "CI/CD", "REST APIs");
  if (/java/i.test(title)) skills.push("Java");
  if (/python/i.test(title)) skills.push("Python");
  if (/cloud/i.test(title)) skills.push("AWS", "Azure", "Cloud");
  if (/data/i.test(title)) skills.push("SQL", "PostgreSQL", "Data engineering");
  if (/embedded|avionics/i.test(title)) skills.push("Embedded", "C", "C++");

  return [
    title,
    "Company: Airbus",
    `Location: ${location}`,
    "Employment type: Full-time",
    `Field: ${family || "Engineering"}`,
    isSenior ? "Seniority: Senior" : "",
    skills.length > 0 ? `Inferred skills: ${skills.join(", ")}` : "",
    isSoftware ? "Role type: Software / Digital engineering" : "Role type: Aerospace engineering",
    "Discovered from the Airbus careers portal (Germany filter).",
    `Portal URL: ${sourceUrl}`,
  ].filter(Boolean).join("\n");
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; ArgusBot/0.1; +https://github.com/merlinfachetti/argus-dashboard)",
      "accept-language": "de-DE,de;q=0.9,en;q=0.8",
    },
    next: { revalidate: 0 },
  });
  if (!response.ok) throw new Error(`Airbus fetch failed: ${response.status}`);
  return response.text();
}

export async function discoverAirbusJobs(limit = 8): Promise<DiscoveredJobListing[]> {
  const html = await fetchHtml(AIRBUS_SEARCH_URL);
  const $    = cheerio.load(html);
  const jobs: DiscoveredJobListing[] = [];

  // Airbus usa um SPA com server-side rendering parcial
  // Tentar múltiplos seletores
  const selectors = [
    "[data-testid*='job']",
    "[class*='job-card']",
    "[class*='jobCard']",
    "[class*='vacancy']",
    "article",
    "li[class*='job']",
    ".results-list li",
  ];

  for (const sel of selectors) {
    const elements = $(sel);
    if (elements.length > 1) {
      elements.each((_i, el) => {
        if (jobs.length >= limit) return false;
        const $el    = $(el);
        const title  = cleanText($el.find("h2,h3,h4,a,.title,[class*='title']").first().text());
        const link   = $el.find("a").first().attr("href") ?? "";
        const loc    = cleanText($el.find("[class*='location'],.location").text()) || "Germany";
        const family = cleanText($el.find("[class*='category'],[class*='family'],[class*='department']").text());

        if (!title || title.length < 6) return;

        const sourceUrl  = link.startsWith("http") ? link : `https://www.airbus.com${link}`;
        const externalId = `airbus-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

        jobs.push({
          title,
          company: "Airbus",
          location: loc,
          family: family || "Engineering",
          source: "airbus",
          sourceUrl,
          externalId,
          descriptionText: buildDescriptionText({ title, location: loc, family: family || "Engineering", sourceUrl }),
        });
      });
      if (jobs.length > 0) break;
    }
  }

  // Fallback: extrair links de vagas
  if (jobs.length === 0) {
    $("a[href*='/careers/'],a[href*='/job'],a[href*='job-id']").each((_i, el) => {
      if (jobs.length >= limit) return false;
      const $el   = $(el);
      const title = cleanText($el.text());
      const href  = $el.attr("href") ?? "";
      if (!title || title.length < 8 || title.length > 120) return;

      const sourceUrl  = href.startsWith("http") ? href : `https://www.airbus.com${href}`;
      const externalId = `airbus-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

      jobs.push({
        title,
        company: "Airbus",
        location: "Germany",
        family: "Engineering",
        source: "airbus",
        sourceUrl,
        externalId,
        descriptionText: buildDescriptionText({ title, location: "Germany", family: "Engineering", sourceUrl }),
      });
    });
  }

  return jobs;
}
