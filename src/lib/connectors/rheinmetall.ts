import * as cheerio from "cheerio";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const RHEINMETALL_SEARCH_URL =
  "https://www.rheinmetall.com/de/karriere/aktuelle-stellenangebote";

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function absoluteUrl(pathOrUrl: string) {
  if (!pathOrUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `https://www.rheinmetall.com${pathOrUrl}`;
}

function buildDescriptionText({
  title,
  company,
  location,
  sourceUrl,
}: {
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
}) {
  return [
    title,
    `Company: ${company}`,
    `Location: ${location}`,
    "Employment type: Not specified",
    `Role type: ${/software|entwickler|engineer|developer|it|digital|platform/i.test(title) ? "Software/IT engineering" : "Engineering/Defense"}`,
    /senior|lead/i.test(title) ? "Seniority: Senior" : "",
    /java/i.test(title) ? "Inferred skills: Java" : "",
    /python/i.test(title) ? "Inferred skills: Python" : "",
    /cloud/i.test(title) ? "Inferred skills: Cloud" : "",
    "Employment type: Full-time",
    "Discovered from the public Rheinmetall careers search.",
    `Portal URL: ${sourceUrl}`,
  ].join("\n");
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; ArgusBot/0.1; +https://github.com/merlinfachetti/argus-dashboard)",
      "accept-language": "de-DE,de;q=0.9,en;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Rheinmetall request failed with ${response.status}`);
  }

  return response.text();
}

function extractCompanyLocation(text: string) {
  const match = text.match(/([^|]+)\|\s*(.+)/);

  if (!match) {
    return {
      company: "Rheinmetall",
      location: "Germany",
    };
  }

  return {
    company: cleanText(match[1]) || "Rheinmetall",
    location: cleanText(match[2]) || "Germany",
  };
}

function cleanRichText(html: string) {
  const $ = cheerio.load(`<div>${html}</div>`);
  return cleanText($("div").text());
}

export async function enrichRheinmetallListing(
  listing: DiscoveredJobListing,
): Promise<DiscoveredJobListing> {
  const html = await fetchHtml(listing.sourceUrl);
  const $ = cheerio.load(html);
  const title = cleanText($("h1").first().text()) || listing.title;
  const subtitle = cleanText($("h1").first().nextAll().slice(0, 2).text());
  const companyLocation = extractCompanyLocation(subtitle);
  const pageText = cleanText($("main").text() || $("body").text());
  const employmentTypeMatch = pageText.match(/Anstellungsart:\s*([^\n]+)/i);
  const contractTypeMatch = pageText.match(/Vertragsart:\s*([^\n]+)/i);
  const referenceMatch = pageText.match(/Ref\.-Nr\.\:\s*([A-Z0-9]+)/i);

  return {
    ...listing,
    title,
    company: companyLocation.company,
    location: companyLocation.location,
    family: listing.family || "Rheinmetall careers",
    experienceLevel: undefined,
    jobType: employmentTypeMatch?.[1]?.trim(),
    employmentType: contractTypeMatch?.[1]?.trim(),
    organization: referenceMatch?.[1]?.trim(),
    detailEnriched: pageText.length > listing.descriptionText.length,
    descriptionText:
      pageText.length > 0
        ? pageText.slice(0, 4000)
        : cleanRichText($.html()) || listing.descriptionText,
  };
}

export async function discoverRheinmetallListings(limit = 6, enrich = false) {
  const html = await fetchHtml(RHEINMETALL_SEARCH_URL);
  const $ = cheerio.load(html);
  const jobs: DiscoveredJobListing[] = [];
  const seen = new Set<string>();

  $("a[href*='/de/job/']").each((_, element) => {
    if (jobs.length >= limit) {
      return false;
    }

    const title = cleanText($(element).text());
    const sourceUrl = absoluteUrl($(element).attr("href") ?? "");
    const externalId =
      sourceUrl.match(/\/(\d+)(?:$|[/?#])/i)?.[1] ??
      sourceUrl.match(/job\/([^/?#]+)/i)?.[1] ??
      "";

    if (!title || !sourceUrl || !externalId || seen.has(externalId)) {
      return;
    }

    const contextText = cleanText($(element).parent().parent().text());
    const companyLocation = extractCompanyLocation(
      contextText.replace(title, "").trim(),
    );

    seen.add(externalId);
    jobs.push({
      source: "Rheinmetall",
      sourceLabel: "Rheinmetall careers",
      externalId,
      title,
      company: companyLocation.company,
      location: companyLocation.location,
      family: "Rheinmetall careers",
      sourceUrl,
      descriptionText: buildDescriptionText({
        title,
        company: companyLocation.company,
        location: companyLocation.location,
        sourceUrl,
      }),
    });
  });

  if (!enrich) {
    return jobs;
  }

  return Promise.all(
    jobs.map(async (job) => {
      try {
        return await enrichRheinmetallListing(job);
      } catch {
        return job;
      }
    }),
  );
}
