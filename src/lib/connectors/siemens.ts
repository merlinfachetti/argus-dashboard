import * as cheerio from "cheerio";
import type { DiscoveredJobListing } from "@/lib/connectors/types";

const SIEMENS_GERMANY_SEARCH_URL =
  "https://jobs.siemens.com/en_US/externaljobs/SearchJobs/?42414=%5B812132%5D&42414_format=17570&listFilterMode=1&folderRecordsPerPage=6&";

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function inferCompany(title: string) {
  return /healthineers/i.test(title) ? "Siemens Healthineers" : "Siemens";
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
  return [
    title,
    `Company: ${company}`,
    `Location: ${location}`,
    "Employment type: Not specified",
    `Field: ${family}`,
    "Discovered from the public Siemens careers search in Germany.",
    "This listing still needs job detail enrichment before a final application decision.",
    `Portal URL: ${sourceUrl}`,
  ].join("\n");
}

export async function discoverSiemensListings(limit = 6) {
  const response = await fetch(SIEMENS_GERMANY_SEARCH_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; ArgusBot/0.1; +https://github.com/merlinfachetti/argus-dashboard)",
      "accept-language": "en-US,en;q=0.9,de;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Siemens search request failed with ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const jobs: DiscoveredJobListing[] = [];

  $("article.article--result").each((_, element) => {
    if (jobs.length >= limit) {
      return false;
    }

    const title = cleanText(
      $(element).find(".article__header__text__title a.link").first().text(),
    );
    const sourceUrl = cleanText(
      $(element).find(".article__header__text__title a.link").attr("href") ?? "",
    );
    const location = cleanText(
      $(element).find(".list-item-location").first().text(),
    );
    const jobIdLabel = cleanText($(element).find(".list-item-jobId").first().text());
    const family = cleanText($(element).find(".list-item-family").first().text());

    const externalId = jobIdLabel.replace("Job ID:", "").trim();

    if (!title || !sourceUrl || !externalId) {
      return;
    }

    const company = inferCompany(title);

    jobs.push({
      source: "Siemens",
      sourceLabel: "Siemens Germany search",
      externalId,
      title,
      company,
      location: location || "Germany",
      family: family || "Not specified",
      sourceUrl,
      descriptionText: buildDescriptionText({
        title,
        company,
        location: location || "Germany",
        family: family || "Not specified",
        sourceUrl,
      }),
    });
  });

  return jobs;
}
