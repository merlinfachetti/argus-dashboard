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
};

export const trackedSources: PortalSource[] = [
  {
    company: "Siemens",
    url: "https://jobs.siemens.com/en_US/externaljobs/SearchJobs/?42414=%5B812132%5D&42414_format=17570&listFilterMode=1&folderRecordsPerPage=6&",
    strategy: "Crawler leve ou browser automation dependendo da paginação.",
    status: "Mapear seletor",
  },
  {
    company: "Bayer",
    url: "https://talent.bayer.com/careers?pid=562949956234521&job%20type=professional",
    strategy: "Priorizar exploração da busca pública e fallback manual.",
    status: "Mapear fluxo",
  },
  {
    company: "SAP",
    url: "https://jobs.sap.com/search/",
    strategy: "Usar pesquisa com filtros por locale e detectar endpoints úteis.",
    status: "Mapear filtros",
  },
  {
    company: "Hensoldt",
    url: "https://jobs.hensoldt.net/search/?optionsFacetsDD_country=DE&optionsFacetsDD_customfield1=Professionals&locale=en_US",
    strategy: "Crawler baseado em listagem e captura de detalhe da vaga.",
    status: "Pronto para discovery",
  },
];

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
