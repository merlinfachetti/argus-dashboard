export type CandidateProfile = {
  name: string;
  headline: string;
  location: string;
  availability: string;
  summary: string;
  coreStack: string[];
  targetRoles: string[];
  strengthSignals: string[];
  languages: string[];
  cvText: string;
  coverLetterText: string;
};

export type PortalSource = {
  company: string;
  url: string;
  strategy: string;
  status: string;
};

export const candidateProfile: CandidateProfile = {
  name: "Merlin Fachetti",
  headline: "Senior Software Engineer",
  location: "Cologne, Germany",
  availability: "Open to product, platform and reliability-oriented roles",
  summary:
    "Senior Software Engineer com mais de 10 anos de experiência em aplicações web de produção. Combina desenvolvimento full stack com TypeScript, Node.js, React e SQL com liderança técnica, mentoring, code review, investigação de incidentes e melhoria de práticas de engenharia.",
  coreStack: [
    "TypeScript",
    "Node.js",
    "React",
    "SQL",
    "PostgreSQL",
    "REST APIs",
    "Docker",
    "CI/CD",
    "GitHub Actions",
    "AWS",
  ],
  targetRoles: [
    "Senior Software Engineer",
    "Fullstack Engineer",
    "Platform Engineer",
    "Application Engineer",
    "Engineering roles with reliability and automation focus",
  ],
  strengthSignals: [
    "Experiência recente em consultoria full stack com automações e dashboards internos",
    "Passagem por liderança técnica e gestão de engenharia",
    "Foco forte em confiabilidade, troubleshooting e root cause analysis",
    "Vivência atual na Alemanha e operação em ambiente high-throughput na Amazon",
  ],
  languages: ["Portuguese", "English", "German"],
  cvText: `Merlin Fachetti
Senior Software Engineer — Cologne, Germany

10+ years of professional experience building and operating production web applications. Strong track record in full stack TypeScript / Node.js / React development, internal platform engineering, workflow automation, and incident response.

Technical stack: TypeScript, JavaScript, Node.js, React, Next.js, SQL, PostgreSQL, REST APIs, Docker, CI/CD, GitHub Actions, AWS.

Experience highlights:
- Full stack delivery for internal platforms and business-critical tools
- Workflow automation and scheduled jobs in production environments
- Incident investigation, root cause analysis and observability practices
- Engineering leadership, mentoring and code review at scale
- Cross-functional collaboration with product, ops and data teams
- Amazon operations environment — high throughput, high reliability bar

Languages: Portuguese (native), English (fluent), German (B2 — working proficiency)
Location: Cologne, Germany — open to hybrid and remote roles across Germany`,
  coverLetterText: `I am particularly interested in senior engineering roles where I can contribute quickly across product delivery, platform reliability and internal tooling. My background combines hands-on full stack development with a strong operational mindset — I care about systems that work in production, not just in demos.

I thrive in cross-functional environments where engineering quality, automation and clear communication matter. Based in Cologne, open to hybrid or remote opportunities across Germany.`,
};

export const trackedSources: PortalSource[] = [
  {
    company: "Siemens",
    url: "https://jobs.siemens.com/en_US/externaljobs/SearchJobs/?42414=%5B812132%5D&42414_format=17570&listFilterMode=1&folderRecordsPerPage=6&",
    strategy: "Crawler leve ou browser automation dependendo da paginação.",
    status: "Discovery live",
  },
  {
    company: "Bayer",
    url: "https://talent.bayer.com/careers?pid=562949956234521&job%20type=professional",
    strategy: "Phenom People portal com fallback HTML parsing.",
    status: "Discovery live",
  },
  {
    company: "SAP",
    url: "https://jobs.sap.com/api/v1/boards/sap/jobs",
    strategy: "Greenhouse API pública — filtra Germany + roles técnicos.",
    status: "Discovery live",
  },
  {
    company: "Hensoldt",
    url: "https://jobs.hensoldt.net/search/?optionsFacetsDD_country=DE&optionsFacetsDD_customfield1=Professionals&locale=en_US",
    strategy: "Crawler de listagem pública com enriquecimento por vaga.",
    status: "Discovery live",
  },
  {
    company: "BWI",
    url: "https://www.bwi.de/karriere/stellenangebote",
    strategy: "Crawler ativo na listagem pública com enriquecimento do detalhe por vaga.",
    status: "Discovery live",
  },
  {
    company: "Eviden",
    url: "https://api.smartrecruiters.com/v1/companies/eviden/postings",
    strategy: "SmartRecruiters API — filtro Germany + IT roles.",
    status: "Discovery live",
  },
  {
    company: "Utimaco",
    url: "https://utimaco.com/careers",
    strategy: "Priorizar listagem pública e captura de detalhe quando disponível.",
    status: "Catalogado para crawler",
  },
  {
    company: "Hornetsecurity",
    url: "https://www.hornetsecurity.com/en/career/",
    strategy: "Mapear fonte pública por área e detectar oportunidade de parser leve.",
    status: "Catalogado para crawler",
  },
  {
    company: "G DATA",
    url: "https://www.gdata.de/jobs",
    strategy: "Avaliar listagem própria e extrair detalhe por vaga para enriquecimento.",
    status: "Catalogado para crawler",
  },
  {
    company: "Rohde & Schwarz",
    url: "https://www.rohde-schwarz.com/de/karriere/stellenangebote/karriere-stellenangebote_251573.html",
    strategy: "Mapear busca com filtros e fluxo de detalhe em portal corporativo.",
    status: "Catalogado para crawler",
  },
  {
    company: "secunet",
    url: "https://www.secunet.com/en/about-us/career",
    strategy: "Analisar careers hub e estruturar fallback manual por job detail.",
    status: "Catalogado para crawler",
  },
  {
    company: "Diehl",
    url: "https://www.diehl.com/career/en/jobs-application/job-offers/",
    strategy: "Crawler em listagem pública com foco em vagas de engenharia na Alemanha.",
    status: "Catalogado para crawler",
  },
  {
    company: "TKMS",
    url: "https://www.tkmsgroup.com/de/karriere",
    strategy: "Mapear portal institucional e detectar origem real das vagas.",
    status: "Catalogado para crawler",
  },
  {
    company: "Airbus",
    url: "https://www.airbus.com/en/careers",
    strategy: "Investigar hub de carreiras e definir estratégia por região/filtro.",
    status: "Catalogado para crawler",
  },
  {
    company: "Rheinmetall",
    url: "https://www.rheinmetall.com/de/karriere/aktuelle-stellenangebote",
    strategy: "Mapear listagem pública, paginação e filtro por engineering roles.",
    status: "Discovery live",
  },
  {
    company: "secunet",
    url: "https://www.secunet.com/en/company/career/job-openings",
    strategy: "Listagem pública com parsing de artigos/linhas da tabela de vagas.",
    status: "Discovery live",
  },
  {
    company: "Rohde & Schwarz",
    url: "https://www.rohde-schwarz.com/de/karriere/stellenangebote_229087.html",
    strategy: "Stellenangebote com listagem pública e filtro por área de engenharia.",
    status: "Discovery live",
  },
  {
    company: "Airbus",
    url: "https://www.airbus.com/en/careers/search-and-apply?country=Germany",
    strategy: "Careers hub com filtro por Germany — parsing de artigos/cards de vaga.",
    status: "Discovery live",
  },
];

const profileSkillMatchers: Record<string, RegExp> = {
  TypeScript: /\btypescript\b/i,
  JavaScript: /\bjavascript\b/i,
  "Node.js": /\bnode(?:\.js)?\b/i,
  React: /\breact(?:\.js)?\b/i,
  "Next.js": /\bnext(?:\.js)?\b/i,
  SQL: /\bsql\b/i,
  PostgreSQL: /\bpostgres(?:ql)?\b/i,
  MySQL: /\bmysql\b/i,
  "REST APIs": /\brest\b|\bapi(?:s)?\b/i,
  Docker: /\bdocker\b/i,
  "CI/CD": /\bci\/cd\b|\bpipeline(?:s)?\b/i,
  "GitHub Actions": /\bgithub actions\b/i,
  AWS: /\baws\b|\bec2\b|\bs3\b|\brds\b/i,
  Python: /\bpython\b/i,
  "System Design": /\bsystem design\b/i,
  Microservices: /\bmicroservices?\b/i,
  Observability: /\bobservability\b|\blog analysis\b/i,
  Automation: /\bautomation\b|\bworkflow\b|\binternal tools?\b/i,
};

function normalizeDocumentText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractDocumentHeadline(text: string, fallback: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const matchingLine = lines.find((line) =>
    /(engineer|developer|architect|lead|manager|platform|sre|security)/i.test(
      line,
    ),
  );

  return matchingLine?.slice(0, 72) ?? fallback;
}

function extractDocumentSkills(text: string) {
  return Object.entries(profileSkillMatchers)
    .filter(([, matcher]) => matcher.test(text))
    .map(([skill]) => skill);
}

function extractDocumentLanguages(text: string) {
  const languages: string[] = [];

  if (/english/i.test(text)) languages.push("English");
  if (/german|deutsch/i.test(text)) languages.push("German");
  if (/portuguese|portugu[eê]s/i.test(text)) languages.push("Portuguese");

  return languages;
}

function extractStrengthSignals(text: string, fallback: string[]) {
  const signals: string[] = [];

  if (/automation|workflow|internal tools?|dashboards?/i.test(text)) {
    signals.push(
      "Experiência forte com automação, workflow e ferramentas internas em produção",
    );
  }

  if (/incident|reliability|observability|maintainability|troubleshooting/i.test(text)) {
    signals.push(
      "Foco consistente em confiabilidade, observabilidade e análise de incidentes",
    );
  }

  if (/mentoring|leadership|code review|technical leadership|engineering management/i.test(text)) {
    signals.push("Vivência com liderança técnica, mentoring e melhoria de práticas");
  }

  if (/react|node|typescript|postgres|sql/i.test(text)) {
    signals.push("Base técnica aderente a stacks modernas de produto e plataforma");
  }

  return signals.length > 0 ? signals : fallback;
}

export function deriveCandidateProfile(
  baseProfile: CandidateProfile,
  overrides?: Partial<Pick<CandidateProfile, "cvText" | "coverLetterText">>,
): CandidateProfile {
  const cvText = overrides?.cvText?.trim() || baseProfile.cvText;
  const coverLetterText =
    overrides?.coverLetterText?.trim() || baseProfile.coverLetterText;
  const combinedDocuments = `${cvText}\n${coverLetterText}`;
  const derivedSkills = extractDocumentSkills(combinedDocuments);
  const derivedLanguages = extractDocumentLanguages(combinedDocuments);

  return {
    ...baseProfile,
    headline: extractDocumentHeadline(cvText, baseProfile.headline),
    summary: normalizeDocumentText(cvText).slice(0, 320) || baseProfile.summary,
    coreStack: Array.from(new Set([...derivedSkills, ...baseProfile.coreStack])).slice(
      0,
      14,
    ),
    strengthSignals: extractStrengthSignals(
      combinedDocuments,
      baseProfile.strengthSignals,
    ),
    languages: Array.from(
      new Set([...baseProfile.languages, ...derivedLanguages]),
    ),
    cvText,
    coverLetterText,
  };
}

export const defaultJobDescription = `Senior Fullstack Engineer
Company: Siemens Digital Industries
Location: Munich or Remote Germany
Employment type: Full-time

We are looking for a Senior Fullstack Engineer to help build internal web platforms and business-critical applications used by operations and finance teams.

Responsibilities
- Build and maintain React and TypeScript applications in production.
- Develop Node.js services and REST APIs for internal workflows.
- Work with PostgreSQL and relational data models.
- Improve CI/CD pipelines, observability and operational reliability.
- Collaborate with product, design and non-technical stakeholders.
- Support debugging, incident analysis and long-term maintainability.

Requirements
- Strong experience with TypeScript, Node.js and React.
- Solid SQL knowledge and experience with PostgreSQL or MySQL.
- Experience with Docker, GitHub Actions and deployment workflows.
- Comfortable working across frontend and backend concerns.
- English required. German is a plus.
- Experience mentoring other engineers is a plus.

Nice to have
- Experience with workflow automation and internal tools.
- Background in system reliability or platform engineering.
- Prior work in high-scale or operational environments.`;
