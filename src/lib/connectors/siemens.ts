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

function absoluteUrl(pathOrUrl: string) {
  if (!pathOrUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `https://jobs.siemens.com${pathOrUrl}`;
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

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; ArgusBot/0.1; +https://github.com/merlinfachetti/argus-dashboard)",
      "accept-language": "en-US,en;q=0.9,de;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Siemens request failed with ${response.status}`);
  }

  return response.text();
}

function cleanRichText(html: string) {
  const $ = cheerio.load(`<div>${html}</div>`);
  return cleanText($("div").text());
}

function extractFieldMap($: cheerio.CheerioAPI) {
  const fields = new Map<string, string>();

  $(".article__content__view__field").each((_, element) => {
    const label = cleanText(
      $(element).find(".article__content__view__field__label").text(),
    );
    const value = cleanText(
      $(element).find(".article__content__view__field__value").first().text(),
    );

    if (label) {
      fields.set(label, value);
    }
  });

  return fields;
}

export async function enrichSiemensListing(
  listing: DiscoveredJobListing,
): Promise<DiscoveredJobListing> {
  const html = await fetchHtml(listing.sourceUrl);
  const $ = cheerio.load(html);
  const fields = extractFieldMap($);

  const title =
    cleanText($(".section__header__text__title").first().text()) || listing.title;
  const locations = $(".tf_locations .list--locations .list__item")
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter(Boolean);
  const descriptionHtml = $(".tf_replaceFieldVideoTokens .article__content__view__field__value")
    .first()
    .html();
  const descriptionText = descriptionHtml ? cleanRichText(descriptionHtml) : "";

  const company = fields.get("Company") || listing.company;
  const family = fields.get("Field of work") || listing.family;
  const location =
    locations.length > 0
      ? locations.join(" | ")
      : fields.get("Location(s)") || listing.location;

  return {
    ...listing,
    title,
    company,
    location,
    family,
    organization: fields.get("Organization"),
    postedSince: fields.get("Posted since"),
    experienceLevel: fields.get("Experience level"),
    jobType: fields.get("Job type"),
    workMode: fields.get("Work mode"),
    employmentType: fields.get("Employment type"),
    locations,
    detailEnriched: Boolean(descriptionText),
    descriptionText:
      descriptionText ||
      buildDescriptionText({
        title,
        company,
        location,
        family,
        sourceUrl: listing.sourceUrl,
      }),
  };
}

export async function discoverSiemensListings(limit = 6, enrich = false) {
  const html = await fetchHtml(SIEMENS_GERMANY_SEARCH_URL);
  const $ = cheerio.load(html);
  const jobs: DiscoveredJobListing[] = [];

  $("article.article--result").each((_, element) => {
    if (jobs.length >= limit) {
      return false;
    }

    const title = cleanText(
      $(element).find(".article__header__text__title a.link").first().text(),
    );
    const rawSourceUrl = cleanText(
      $(element).find(".article__header__text__title a.link").attr("href") ?? "",
    );
    const sourceUrl = absoluteUrl(rawSourceUrl);
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

  if (!enrich) {
    return jobs;
  }

  return Promise.all(
    jobs.map(async (job) => {
      try {
        return await enrichSiemensListing(job);
      } catch {
        return job;
      }
    }),
  );
}
