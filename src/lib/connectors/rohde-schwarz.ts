import * as cheerio from "cheerio";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const RS_SEARCH_URL =
  "https://www.rohde-schwarz.com/de/karriere/stellenangebote_229087.html";

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
  const isSoftware = /software|developer|engineer|entwickler|it |digital|platform|devops|architect|embedded/i.test(title + " " + family);
  const isSenior   = /senior|lead|principal|expert/i.test(title);
  const isEmbedded = /embedded|firmware|fpga|hardware/i.test(title + " " + family);

  const skills: string[] = [];
  if (isSoftware && !isEmbedded) skills.push("Software engineering", "TypeScript", "C#", "REST APIs", "CI/CD");
  if (isEmbedded) skills.push("Embedded", "C", "C++", "FPGA", "Linux");
  if (/java/i.test(title)) skills.push("Java");
  if (/python/i.test(title)) skills.push("Python");
  if (/cloud/i.test(title)) skills.push("AWS", "Azure", "Cloud");
  if (/\.net/i.test(title)) skills.push(".NET", "C#");

  return [
    title,
    "Company: Rohde & Schwarz",
    `Location: ${location}`,
    "Employment type: Full-time",
    `Field: ${family || "Engineering"}`,
    isSenior ? "Seniority: Senior" : "",
    skills.length > 0 ? `Inferred skills: ${skills.join(", ")}` : "",
    isSoftware ? "Role type: Software engineering / R&D" : isEmbedded ? "Role type: Embedded / Hardware engineering" : "Role type: Engineering",
    "Discovered from the Rohde & Schwarz Stellenangebote portal.",
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
  if (!response.ok) throw new Error(`R&S fetch failed: ${response.status}`);
  return response.text();
}

export async function discoverRohdeSchwarzJobs(limit = 8): Promise<DiscoveredJobListing[]> {
  const html = await fetchHtml(RS_SEARCH_URL);
  const $    = cheerio.load(html);
  const jobs: DiscoveredJobListing[] = [];

  // R&S usa uma lista de vagas com data-* attributes ou artigos
  const selectors = [
    "[class*='job-item']",
    "[class*='vacancy']",
    "[class*='stellenangebot']",
    "li.job",
    "article.job",
    ".career-list li",
    "ul.jobs li",
    "table tbody tr",
  ];

  for (const sel of selectors) {
    const elements = $(sel);
    if (elements.length > 1) {
      elements.each((_i, el) => {
        if (jobs.length >= limit) return false;
        const $el    = $(el);
        const title  = cleanText($el.find("h2,h3,h4,a,.title,[class*='title']").first().text());
        const link   = $el.find("a").first().attr("href") ?? "";
        const loc    = cleanText($el.find("[class*='location'],td:nth-child(3),.location").text());
        const family = cleanText($el.find("[class*='category'],[class*='department'],td:nth-child(2)").text());

        if (!title || title.length < 4) return;

        const sourceUrl  = link.startsWith("http") ? link : `https://www.rohde-schwarz.com${link}`;
        const externalId = `rs-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

        jobs.push({
          title,
          company: "Rohde & Schwarz",
          location: loc || "Munich, Germany",
          family: family || "Engineering",
          source: "rohde-schwarz",
          sourceUrl,
          externalId,
          descriptionText: buildDescriptionText({ title, location: loc || "Munich, Germany", family: family || "Engineering", sourceUrl }),
        });
      });
      if (jobs.length > 0) break;
    }
  }

  // Fallback link extraction
  if (jobs.length === 0) {
    $("a[href*='job'],a[href*='stell'],a[href*='career']").each((_i, el) => {
      if (jobs.length >= limit) return false;
      const $el  = $(el);
      const title = cleanText($el.text());
      const href  = $el.attr("href") ?? "";
      if (!title || title.length < 8 || title.length > 120) return;

      const sourceUrl  = href.startsWith("http") ? href : `https://www.rohde-schwarz.com${href}`;
      const externalId = `rs-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

      jobs.push({
        title,
        company: "Rohde & Schwarz",
        location: "Munich, Germany",
        family: "Engineering",
        source: "rohde-schwarz",
        sourceUrl,
        externalId,
        descriptionText: buildDescriptionText({ title, location: "Munich, Germany", family: "Engineering", sourceUrl }),
      });
    });
  }

  return jobs;
}
