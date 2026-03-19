import type { CandidateProfile } from "@/lib/profile";

export type ParsedJob = {
  title: string;
  company: string;
  location: string;
  seniority: string;
  workModel: string;
  employmentType: string;
  languages: string[];
  skills: string[];
  summary: string;
};

export type MatchAnalysis = {
  score: number;
  verdict: "Alta prioridade" | "Boa aderência" | "Aderência parcial";
  strengths: string[];
  risks: string[];
};

const knownSkills = [
  "TypeScript",
  "JavaScript",
  "Node.js",
  "React",
  "Next.js",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "REST APIs",
  "Docker",
  "CI/CD",
  "GitHub Actions",
  "AWS",
  "Python",
  "System Design",
  "Microservices",
  "Observability",
  "Automation",
];

const skillMatchers: Record<string, RegExp> = {
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
  "CI/CD": /\bci\/cd\b|\bci cd\b|\bpipeline(?:s)?\b/i,
  "GitHub Actions": /\bgithub actions\b/i,
  AWS: /\baws\b|\bec2\b|\bs3\b|\brds\b/i,
  Python: /\bpython\b/i,
  "System Design": /\bsystem design\b/i,
  Microservices: /\bmicroservices?\b/i,
  Observability: /\bobservability\b|\blog analysis\b/i,
  Automation: /\bautomation\b|\bworkflow\b|\bscheduled jobs?\b/i,
};

function extractTitle(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const titledLine = lines.find((line) =>
    /(engineer|developer|manager|lead|architect|specialist|entwickler|projektleiter)/i.test(
      line,
    ),
  );

  return titledLine ?? "Untitled role";
}

function extractCompany(text: string) {
  const companyMatch = text.match(/company:\s*(.+)/i);
  if (companyMatch) {
    return companyMatch[1].trim();
  }

  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (firstLine && firstLine.includes(" at ")) {
    return firstLine.split(" at ").at(-1)?.trim() ?? "Empresa não identificada";
  }

  return "Empresa não identificada";
}

function extractLocation(text: string) {
  const locationMatch = text.match(/location:\s*(.+)/i);
  if (locationMatch) {
    return locationMatch[1].trim();
  }

  if (/remote/i.test(text) && /germany/i.test(text)) {
    return "Remote Germany";
  }

  if (/hybrid/i.test(text)) {
    return "Hybrid";
  }

  if (/remote/i.test(text)) {
    return "Remote";
  }

  return "Location not specified";
}

function extractSeniority(text: string) {
  if (/\bstaff\b/i.test(text)) return "Staff";
  if (/\blead\b/i.test(text)) return "Lead";
  if (/\bsenior\b/i.test(text)) return "Senior";
  if (/\bmid\b|\bmiddle\b/i.test(text)) return "Mid-level";
  if (/\bjunior\b/i.test(text)) return "Junior";
  return "Not specified";
}

function extractWorkModel(text: string) {
  if (/hybrid/i.test(text)) return "Hybrid";
  if (/remote/i.test(text)) return "Remote-friendly";
  if (/on-?site/i.test(text)) return "On-site";
  return "Not specified";
}

function extractEmploymentType(text: string) {
  const employmentMatch = text.match(/employment type:\s*(.+)/i);
  if (employmentMatch) {
    return employmentMatch[1].trim();
  }

  if (/full-?time/i.test(text)) return "Full-time";
  if (/contract/i.test(text)) return "Contract";
  if (/part-?time/i.test(text)) return "Part-time";
  return "Not specified";
}

function extractLanguages(text: string) {
  const languages: string[] = [];

  if (/english/i.test(text)) languages.push("English");
  if (/german|deutsch/i.test(text)) languages.push("German");
  if (/portuguese|portugu[eê]s/i.test(text)) languages.push("Portuguese");

  return languages.length > 0 ? languages : ["English"];
}

function extractSkills(text: string) {
  return knownSkills.filter((skill) => skillMatchers[skill].test(text));
}

function extractSummary(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.slice(0, 280);
}

export function parseJobDescription(text: string): ParsedJob {
  return {
    title: extractTitle(text),
    company: extractCompany(text),
    location: extractLocation(text),
    seniority: extractSeniority(text),
    workModel: extractWorkModel(text),
    employmentType: extractEmploymentType(text),
    languages: extractLanguages(text),
    skills: extractSkills(text),
    summary: extractSummary(text),
  };
}

export function analyzeJobMatch(
  job: ParsedJob,
  profile: CandidateProfile,
): MatchAnalysis {
  const combinedText = `${job.title} ${job.summary}`;
  const profileSkills = new Set(profile.coreStack);
  const matchedSkills = job.skills.filter((skill) => profileSkills.has(skill));
  const skillCoverage =
    job.skills.length > 0 ? matchedSkills.length / job.skills.length : 0.55;

  let score = Math.round(skillCoverage * 58);

  if (
    /(senior|lead)/i.test(job.seniority) ||
    /(senior|lead)/i.test(job.title)
  ) {
    score += 12;
  }

  if (/remote|germany|hybrid/i.test(job.location) || /remote/i.test(job.workModel)) {
    score += 8;
  }

  if (
    /automation/i.test(job.summary) ||
    /workflow/i.test(job.summary) ||
    /internal/i.test(job.summary)
  ) {
    score += 8;
  }

  if (
    /reliability|incident|maintainability|observability/i.test(job.summary)
  ) {
    score += 8;
  }

  if (
    /software|fullstack|frontend|front-end|backend|web|application|platform|developer|entwickler|engineer/i.test(
      combinedText,
    )
  ) {
    score += 10;
  }

  if (
    /research & development|engineering|information technology|intralogistik software/i.test(
      combinedText,
    )
  ) {
    score += 6;
  }

  if (
    /procurement|marketing|sales|customer services|finance(?! teams)|hr|human resources/i.test(
      combinedText,
    ) &&
    !/software|fullstack|frontend|backend|developer|entwickler|engineer/i.test(
      combinedText,
    )
  ) {
    score -= 12;
  }

  if (/german/i.test(job.languages.join(" "))) {
    score -= 4;
  }

  score = Math.max(35, Math.min(score, 96));

  const strengths = [
    matchedSkills.length > 0
      ? `Match técnico direto em ${matchedSkills.join(", ")}.`
      : "Experiência full stack e de produção relevante para a vaga.",
    "Histórico forte com sistemas internos, automação e colaboração cross-functional.",
    "Experiência com debugging, incident investigation e confiabilidade operacional.",
  ];

  const risks = [
    matchedSkills.length < Math.max(2, Math.ceil(job.skills.length / 2))
      ? "Há stack pedida que ainda não apareceu com força suficiente no match atual."
      : "Gap técnico principal parece administrável.",
    job.languages.includes("German")
      ? "Se o time exigir alemão avançado no dia a dia, isso pode reduzir prioridade."
      : "Idioma não parece ser um bloqueio relevante nesta vaga.",
    /staff/i.test(job.seniority)
      ? "Caso a vaga espere escopo Staff muito amplo, vale revisar expectativa de arquitetura e influência."
      : "Escopo aparenta estar próximo do perfil alvo.",
  ];

  const verdict =
    score >= 78
      ? "Alta prioridade"
      : score >= 62
        ? "Boa aderência"
        : "Aderência parcial";

  return {
    score,
    verdict,
    strengths,
    risks,
  };
}

export function buildRecruiterMessage(
  job: ParsedJob,
  profile: CandidateProfile,
  analysis: MatchAnalysis,
) {
  return `Hi, I came across the ${job.title} opportunity and it looks strongly aligned with my background. I am a ${profile.headline} based in ${profile.location} with 10+ years of experience building and maintaining production web applications using ${profile.coreStack
    .slice(0, 4)
    .join(", ")}.

In my recent work, I have been delivering internal platforms, workflow automation and business-critical tools with a strong focus on reliability, maintainability and cross-functional collaboration. The role stands out because of its fit with my experience in production systems and its current match score in Argus is ${analysis.score}%.

If the team is looking for someone who can contribute quickly across product delivery, engineering quality and operational clarity, I would be glad to connect and share more context.`;
}
