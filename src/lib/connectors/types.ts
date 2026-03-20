export type SupportedConnectorSource = "Siemens" | "Rheinmetall";

export type DiscoveredJobListing = {
  source: SupportedConnectorSource;
  sourceLabel: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  family: string;
  sourceUrl: string;
  descriptionText: string;
  organization?: string;
  postedSince?: string;
  experienceLevel?: string;
  jobType?: string;
  workMode?: string;
  employmentType?: string;
  locations?: string[];
  detailEnriched?: boolean;
};
