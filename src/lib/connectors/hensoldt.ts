import * as cheerio from "cheerio";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const HENSOLDT_SEARCH_URL =
  "https://jobs.hensoldt.net/search/?optionsFacetsDD_country=DE&optionsFacetsDD_customfield1=Professionals&locale=en_US";

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function absoluteUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `https://jobs.hensoldt.net${pathOrUrl}`;
}

function buildDescriptionText({
  title,
  company,
  location,
  family,
  sourceUrl,
}: {
  title: string;
  company: string;
  location: string;
  family: string;
  sourceUrl: string;
}) {
  const isSoftware = /software|engineer|developer|entwickler|it |digital|platform|devops|architect|security|cyber/i.test(title + " " + family);
  const isSenior = /senior|lead|principal|sr\./i.test(title);

  const inferredSkills: string[] = [];
  if (isSoftware) inferredSkills.push("Software engineering", "TypeScript", "REST APIs", "CI/CD");
  if (/java/i.test(title + family)) inferredSkills.push("Java");
  if (/python/i.test(title + family)) inferredSkills.push("Python");
  if (/cloud|aws|azure/i.test(title + family)) inferredSkills.push("Cloud");
  if (/security|cyber|sicherheit/i.test(title + family)) inferredSkills.push("Security", "Cybersecurity");
  if (/embedded|firmware/i.test(title + family)) inferredSkills.push("Embedded systems");

  return [
    title,
    `Company: ${company}`,
    `Location: ${location}`,
    "Employment type: Full-time",
    `Field: ${family}`,
    isSenior ? "Seniority: Senior" : "",
    isSoftware ? "Role type: Software/IT engineering" : "Role type: Engineering/Defense",
    inferredSkills.length > 0 ? `Inferred skills: ${inferredSkills.join(", ")}` : "",
    "Discovered from the public Hensoldt careers portal (Germany).",
    `Portal URL: ${sourceUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; ArgusBot/0.1; +https://github.com/merlinfachetti/argus-dashboard)",
      "accept-language": "en-US,en;q=0.9,de;q=0.8",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Hensoldt request failed with ${response.status}`);
  }

  return response.text();
}

async function enrichJobDetail(
  sourceUrl: string,
  baseTitle: string,
  baseLocation: string,
  baseFamily: string,
): Promise<{ descriptionText: string; location: string }> {
  try {
    const html = await fetchHtml(sourceUrl);
    const $ = cheerio.load(html);

    // Hensoldt usa um layout típico de Radancy/iCIMS
    const bodyText = cleanText(
      $(".job-description, .jobad-detail, [class*=description], article, main")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000),
    );

    // Tentar capturar localização da página de detalhe
    const locationEl = $("[class*=location], [data-label=Location]").first().text().trim();
    const detailLocation = locationEl ? cleanText(locationEl) : baseLocation;

    if (bodyText.length > 100) {
      return {
        descriptionText: [
          baseTitle,
          `Company: Hensoldt`,
          `Location: ${detailLocation}`,
          "Employment type: Full-time",
          `Field: ${baseFamily}`,
          bodyText.slice(0, 600),
          `Portal URL: ${sourceUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
        location: detailLocation,
      };
    }
  } catch {
    // Fallback silencioso
  }

  return {
    descriptionText: buildDescriptionText({
      title: baseTitle,
      company: "Hensoldt",
      location: baseLocation,
      family: baseFamily,
      sourceUrl,
    }),
    location: baseLocation,
  };
}

function parseListings(
  html: string,
): Array<{ title: string; location: string; family: string; url: string }> {
  const $ = cheerio.load(html);
  const results: Array<{ title: string; location: string; family: string; url: string }> = [];

  // Hensoldt usa Radancy — seletores típicos
  const selectors = [
    "article.job-listing",
    ".job-search-results .job",
    "[class*=job-item]",
    "[class*=jobItem]",
    "li.job",
    ".search-result-item",
    "tr.data-row",
    ".job-title a",
  ];

  // Tentar encontrar o container de resultados
  for (const sel of selectors) {
    const items = $(sel);
    if (items.length > 0) {
      items.each((_, el) => {
        const $el = $(el);
        const titleEl = $el.find("a[href*=job], a[href*=position], h2 a, h3 a, .job-title a").first();
        const title = cleanText(titleEl.text() || $el.find("h2, h3, .title").first().text());
        const href = titleEl.attr("href") || $el.find("a").first().attr("href") || "";
        const location = cleanText(
          $el.find("[class*=location], [class*=city], .location").first().text() || "Germany",
        );
        const family = cleanText(
          $el.find("[class*=category], [class*=department], .category").first().text() ||
          "Hensoldt careers",
        );

        if (title && href) {
          results.push({ title, location, family, url: absoluteUrl(href) });
        }
      });
      if (results.length > 0) break;
    }
  }

  // Fallback: buscar por links com padrão de vaga
  if (results.length === 0) {
    $("a[href]").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") ?? "";
      const text = cleanText($el.text());

      if (
        /\/job\/|\/position\/|\/vacancy\/|requisition/i.test(href) &&
        text.length > 5 &&
        text.length < 120
      ) {
        results.push({
          title: text,
          location: "Germany",
          family: "Hensoldt careers",
          url: absoluteUrl(href),
        });
      }
    });
  }

  return results;
}

export async function discoverHensoldtJobs(
  limit = 6,
  enrich = false,
): Promise<DiscoveredJobListing[]> {
  const html = await fetchHtml(HENSOLDT_SEARCH_URL);
  const rawListings = parseListings(html).slice(0, limit);

  if (rawListings.length === 0) {
    throw new Error(
      "Hensoldt: nenhuma vaga encontrada — o portal pode ter mudado de estrutura",
    );
  }

  const results: DiscoveredJobListing[] = [];

  for (const listing of rawListings) {
    if (enrich && listing.url) {
      const { descriptionText, location } = await enrichJobDetail(
        listing.url,
        listing.title,
        listing.location,
        listing.family,
      );
      results.push({
        externalId: listing.url,
        title: listing.title,
        company: "Hensoldt",
        location,
        source: "hensoldt",
        sourceUrl: listing.url,
        family: listing.family,
        descriptionText,
      });
    } else {
      results.push({
        externalId: listing.url,
        title: listing.title,
        company: "Hensoldt",
        location: listing.location,
        source: "hensoldt",
        sourceUrl: listing.url,
        family: listing.family,
        descriptionText: buildDescriptionText({
          title: listing.title,
          company: "Hensoldt",
          location: listing.location,
          family: listing.family,
          sourceUrl: listing.url,
        }),
      });
    }
  }

  return results;
}
