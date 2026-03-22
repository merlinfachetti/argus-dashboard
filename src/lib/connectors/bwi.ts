import * as cheerio from "cheerio";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const BWI_SEARCH_URL = "https://www.bwi.de/karriere/stellenangebote";

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

  return `https://www.bwi.de${pathOrUrl}`;
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
  return [
    title,
    "Company: BWI",
    `Location: ${location}`,
    "Employment type: Vollzeit",
    `Field: ${family}`,
    `Role type: ${/software|entwickler|engineer|developer|it|digital|platform|devops/i.test(title) ? "Software/IT engineering" : "Other"}`,
    /senior|lead/i.test(title) ? "Seniority: Senior" : "",
    /java/i.test(title) ? "Inferred skills: Java, CI/CD" : "",
    /python/i.test(title) ? "Inferred skills: Python" : "",
    /cloud|aws|azure/i.test(title) ? "Inferred skills: Cloud, AWS" : "",
    "Employment type: Full-time",
    "Discovered from the public BWI Stellenangebote portal.",
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
    throw new Error(`BWI request failed with ${response.status}`);
  }

  return response.text();
}

function inferLocation(contextText: string) {
  const inMatch = contextText.match(/\bin\s+(.+?)(?:\s{2,}|$)/i);

  if (inMatch?.[1]) {
    return cleanText(inMatch[1]);
  }

  if (/bundesweit/i.test(contextText)) {
    return "Bundesweit, Germany";
  }

  return "Germany";
}

function inferFamily(contextText: string, title: string) {
  const withoutTitle = cleanText(contextText.replace(title, ""));
  const familyChunks = withoutTitle
    .split(/ {2,}|\s(?=Account Management|Cloud|Collaboration|Datenbanken|Governance|Strategie|Innovation|IT Consulting|IT-|Military|Mobility|Netzwerktechnologie|Plattform|Portfoliomanagement|SAP|Servicetechnik|Service Delivery Management|Softwareentwicklung|Solution Design|Workplace|Zentralbereiche)/)
    .map(cleanText)
    .filter(Boolean);

  const candidates = familyChunks.filter(
    (chunk) =>
      !/\b(ab sofort|vollzeit|teilzeit|bundesweit|in [A-ZÄÖÜ])/i.test(chunk) &&
      chunk.length < 120,
  );

  return candidates.at(-1) ?? "BWI careers";
}

function extractSection(text: string, heading: string, nextHeading: string[]) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nextPattern = nextHeading
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(
    `${escapedHeading}:?\\s*([\\s\\S]*?)(?:${nextPattern}|$)`,
    "i",
  );
  const match = text.match(regex);
  return cleanText(match?.[1] ?? "");
}

export async function enrichBwiListing(
  listing: DiscoveredJobListing,
): Promise<DiscoveredJobListing> {
  const html = await fetchHtml(listing.sourceUrl);
  const $ = cheerio.load(html);
  const mainText = cleanText($("main").text() || $("body").text());
  const title = cleanText($("h1").first().text()) || listing.title;
  const externalIdMatch = mainText.match(/Stellen-ID:\s*(\d+)/i);
  const subtitle = cleanText($("h1").first().nextAll("h2, h3, p").slice(0, 2).text());
  const location = subtitle || listing.location;
  const responsibilities = extractSection(mainText, "Ihre Aufgaben", [
    "Ihr Profil",
    "Wir bieten",
    "Weitere offene Stellen",
  ]);
  const profile = extractSection(mainText, "Ihr Profil", [
    "Wir bieten",
    "Weitere offene Stellen",
  ]);
  const benefits = extractSection(mainText, "Wir bieten", [
    "Weitere offene Stellen",
    "Job Benachrichtigung",
  ]);
  const descriptionText = cleanText(
    [
      title,
      `Company: BWI`,
      `Location: ${location}`,
      responsibilities && `Responsibilities: ${responsibilities}`,
      profile && `Profile: ${profile}`,
      benefits && `Benefits: ${benefits}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return {
    ...listing,
    title,
    externalId: externalIdMatch?.[1] ?? listing.externalId,
    company: "BWI",
    location,
    family: listing.family || "BWI careers",
    experienceLevel:
      /mindestens\s+6\s+jahre/i.test(mainText) || /senior/i.test(title)
        ? "Senior"
        : undefined,
    employmentType: /vollzeit/i.test(mainText) ? "Vollzeit" : listing.employmentType,
    workMode: /mobiles arbeiten|hybrid|vertrauensarbeitszeit/i.test(mainText)
      ? "Hybrid"
      : listing.workMode,
    organization: externalIdMatch?.[1],
    detailEnriched: descriptionText.length > listing.descriptionText.length,
    descriptionText: descriptionText || listing.descriptionText,
  };
}

export async function discoverBwiListings(limit = 6, enrich = false) {
  const html = await fetchHtml(BWI_SEARCH_URL);
  const $ = cheerio.load(html);
  const jobs: DiscoveredJobListing[] = [];
  const seen = new Set<string>();

  $("main a[href*='/karriere/stellenangebote/job/']").each((_, element) => {
    if (jobs.length >= limit) {
      return false;
    }

    const title = cleanText($(element).text());
    const sourceUrl = absoluteUrl($(element).attr("href") ?? "");
    const externalId =
      sourceUrl.match(/-(\d+)(?:$|[/?#])/i)?.[1] ??
      sourceUrl.match(/\/job\/([^/?#]+)/i)?.[1] ??
      "";

    if (!title || !sourceUrl || !externalId || seen.has(externalId)) {
      return;
    }

    const containerText = cleanText(
      $(element)
        .closest("article, li, div, section")
        .text(),
    );
    const location = inferLocation(containerText.replace(title, ""));
    const family = inferFamily(containerText, title);

    seen.add(externalId);
    jobs.push({
      source: "BWI",
      sourceLabel: "BWI Stellenangebote",
      externalId,
      title,
      company: "BWI",
      location,
      family,
      sourceUrl,
      employmentType: /vollzeit/i.test(containerText) ? "Vollzeit" : undefined,
      descriptionText: buildDescriptionText({
        title,
        location,
        family,
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
        return await enrichBwiListing(job);
      } catch {
        return job;
      }
    }),
  );
}
