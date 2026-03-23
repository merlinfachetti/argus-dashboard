import * as cheerio from "cheerio";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const SECUNET_SEARCH_URL =
  "https://www.secunet.com/en/company/career/job-openings";

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
  const isSoftware = /software|developer|engineer|entwickler|it |security|cyber|architect|platform|devops/i.test(title + " " + family);
  const isSenior   = /senior|lead|principal|expert/i.test(title);

  const skills: string[] = [];
  if (isSoftware) skills.push("Software engineering", "Security", "TypeScript", "REST APIs", "CI/CD");
  if (/java/i.test(title + " " + family)) skills.push("Java");
  if (/python/i.test(title + " " + family)) skills.push("Python");
  if (/cloud/i.test(title + " " + family)) skills.push("Cloud", "AWS");
  if (/linux/i.test(title + " " + family)) skills.push("Linux");
  if (/network|netzwerk/i.test(title + " " + family)) skills.push("Networking");

  return [
    title,
    "Company: secunet Security Networks",
    `Location: ${location}`,
    "Employment type: Full-time",
    `Field: ${family || "IT Security"}`,
    isSenior ? "Seniority: Senior" : "",
    skills.length > 0 ? `Inferred skills: ${skills.join(", ")}` : "",
    isSoftware ? "Role type: IT Security / Software engineering" : "Role type: Security & Defense",
    "Discovered from the public secunet job openings portal.",
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

  if (!response.ok) {
    throw new Error(`secunet fetch failed: ${response.status}`);
  }
  return response.text();
}

export async function discoverSecunetJobs(limit = 8): Promise<DiscoveredJobListing[]> {
  const html  = await fetchHtml(SECUNET_SEARCH_URL);
  const $     = cheerio.load(html);
  const jobs: DiscoveredJobListing[] = [];

  // secunet usa um layout de lista de vagas com artigos ou linhas de tabela
  const selectors = [
    "article.job",
    ".job-listing",
    ".job-item",
    "tr.job",
    ".career-item",
    "li.job",
    "[class*='job']",
    "table tr",
  ];

  let found = false;

  for (const sel of selectors) {
    const elements = $(sel);
    if (elements.length > 1) {
      elements.each((_i, el) => {
        if (jobs.length >= limit) return false;

        const $el    = $(el);
        const title  = cleanText($el.find("h2,h3,h4,.title,.job-title,a").first().text());
        const link   = $el.find("a").first().attr("href") ?? "";
        const loc    = cleanText($el.find(".location,[class*='location'],td:nth-child(3)").text());
        const family = cleanText($el.find(".category,[class*='category'],[class*='department'],td:nth-child(2)").text());

        if (!title || title.length < 4) return;

        const sourceUrl = link.startsWith("http") ? link : `https://www.secunet.com${link}`;
        const externalId = `secunet-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

        jobs.push({
          title,
          company: "secunet",
          location: loc || "Germany",
          family: family || "IT Security",
          source: "secunet",
          sourceUrl,
          externalId,
          descriptionText: buildDescriptionText({ title, location: loc || "Germany", family: family || "IT Security", sourceUrl }),
        });
        found = true;
      });

      if (found && jobs.length > 0) break;
    }
  }

  // Fallback: extrair todos os links que parecem vagas
  if (jobs.length === 0) {
    $("a[href*='job'],a[href*='stell'],a[href*='career'],a[href*='position']").each((_i, el) => {
      if (jobs.length >= limit) return false;
      const $el  = $(el);
      const title = cleanText($el.text());
      const href  = $el.attr("href") ?? "";
      if (!title || title.length < 8 || title.length > 120) return;

      const sourceUrl  = href.startsWith("http") ? href : `https://www.secunet.com${href}`;
      const externalId = `secunet-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

      jobs.push({
        title,
        company: "secunet",
        location: "Germany",
        family: "IT Security",
        source: "secunet",
        sourceUrl,
        externalId,
        descriptionText: buildDescriptionText({ title, location: "Germany", family: "IT Security", sourceUrl }),
      });
    });
  }

  return jobs;
}
