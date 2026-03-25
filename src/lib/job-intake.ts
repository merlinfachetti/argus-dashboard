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

// ─── Skill matchers ──────────────────────────────────────────────────────────

const knownSkills = [
  "TypeScript", "JavaScript", "Node.js", "React", "Next.js",
  "Vue.js", "Angular", "SQL", "PostgreSQL", "MySQL", "MongoDB",
  "Redis", "REST APIs", "GraphQL", "gRPC", "Docker", "Kubernetes",
  "CI/CD", "GitHub Actions", "GitLab CI", "AWS", "Azure", "GCP",
  "Python", "Java", "Go", "Rust", "C#", ".NET",
  "System Design", "Microservices", "Observability", "Automation",
  "Linux", "Terraform", "Ansible", "ElasticSearch", "Kafka",
];

const skillMatchers: Record<string, RegExp> = {
  TypeScript:      /\btypescript\b/i,
  JavaScript:      /\bjavascript\b|\bjs\b/i,
  "Node.js":       /\bnode(?:\.js)?\b/i,
  React:           /\breact(?:\.js)?\b/i,
  "Next.js":       /\bnext(?:\.js)?\b/i,
  "Vue.js":        /\bvue(?:\.js)?\b/i,
  Angular:         /\bangular\b/i,
  SQL:             /\bsql\b/i,
  PostgreSQL:      /\bpostgres(?:ql)?\b/i,
  MySQL:           /\bmysql\b/i,
  MongoDB:         /\bmongo(?:db)?\b/i,
  Redis:           /\bredis\b/i,
  "REST APIs":     /\brest\b|\brestful\b|\bapi(?:s)?\b/i,
  GraphQL:         /\bgraphql\b/i,
  gRPC:            /\bgrpc\b/i,
  Docker:          /\bdocker\b/i,
  Kubernetes:      /\bkubernetes\b|\bk8s\b/i,
  "CI/CD":         /\bci\/cd\b|\bci cd\b|\bpipeline(?:s)?\b/i,
  "GitHub Actions":/\bgithub actions\b/i,
  "GitLab CI":     /\bgitlab ci\b|\bgitlab\b/i,
  AWS:             /\baws\b|\bec2\b|\bs3\b|\brds\b|\blambda\b/i,
  Azure:           /\bazure\b/i,
  GCP:             /\bgcp\b|\bgoogle cloud\b/i,
  Python:          /\bpython\b/i,
  Java:            /\bjava\b(?!script)/i,
  Go:              /\bgolang\b|\bgo\b(?= )/i,
  Rust:            /\brust\b/i,
  "C#":            /\bc#\b|\b\.net\b/i,
  ".NET":          /\b\.net\b/i,
  "System Design": /\bsystem design\b|\barchitecture\b|\barchitektur\b/i,
  Microservices:   /\bmicroservices?\b/i,
  Observability:   /\bobservability\b|\bmonitoring\b|\bprometheus\b|\bgrafana\b/i,
  Automation:      /\bautomation\b|\bworkflow\b|\bscripting\b/i,
  Linux:           /\blinux\b|\bbash\b|\bunix\b/i,
  Terraform:       /\bterraform\b|\biac\b/i,
  Ansible:         /\bansible\b/i,
  ElasticSearch:   /\belasticsearch\b|\belastic\b/i,
  Kafka:           /\bkafka\b/i,
};

// ─── JD parsers ──────────────────────────────────────────────────────────────

function extractTitle(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Linha explícita com label "title:" ou "role:"
  const labeled = lines.find((l) => /^(?:title|role|position|stelle):\s*/i.test(l));
  if (labeled) return labeled.replace(/^(?:title|role|position|stelle):\s*/i, "").trim();

  // Primeira linha que parece um título de cargo
  const roleKeywords = /(engineer|developer|entwickler|architect|specialist|lead|manager|analyst|devops|sre|platform|fullstack|frontend|backend|software)/i;
  const match = lines.find((l) => roleKeywords.test(l) && l.length < 100);
  return match ?? lines[0] ?? "Untitled role";
}

function extractCompany(text: string) {
  const m = text.match(/(?:company|unternehmen|firma|employer):\s*(.+)/i);
  if (m) return m[1].trim();
  const atMatch = text.match(/\bat\s+([A-Z][A-Za-z0-9& .-]{1,40})/);
  if (atMatch) return atMatch[1].trim();
  return "Empresa não identificada";
}

function extractLocation(text: string) {
  const m = text.match(/(?:location|standort|ort|city):\s*(.+)/i);
  if (m) return m[1].trim();
  if (/remote.*germany|germany.*remote/i.test(text)) return "Remote Germany";
  if (/\bhybrid\b/i.test(text)) return "Hybrid";
  if (/\bremote\b/i.test(text)) return "Remote";
  // Cidades alemãs comuns
  const cities = ["Munich", "München", "Berlin", "Hamburg", "Cologne", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Nuremberg", "Nürnberg", "Bonn", "Ulm", "Kassel"];
  const cityMatch = cities.find((c) => new RegExp(`\\b${c}\\b`, "i").test(text));
  if (cityMatch) return cityMatch;
  return "Location not specified";
}

function extractSeniority(text: string) {
  if (/\bstaff\b/i.test(text)) return "Staff";
  if (/\bprincipal\b/i.test(text)) return "Principal";
  if (/\blead\b/i.test(text)) return "Lead";
  if (/\bsenior\b|\bsr\.\b/i.test(text)) return "Senior";
  if (/\bmid[\s-]?level\b|\bmiddle\b/i.test(text)) return "Mid-level";
  if (/\bjunior\b|\bjr\.\b/i.test(text)) return "Junior";
  return "Not specified";
}

function extractWorkModel(text: string) {
  if (/\bhybrid\b/i.test(text)) return "Hybrid";
  if (/remote.*germany|germany.*remote|homeoffice/i.test(text)) return "Remote Germany";
  if (/\bremote\b/i.test(text)) return "Remote-friendly";
  if (/on-?site|vor\s*ort\b/i.test(text)) return "On-site";
  return "Not specified";
}

function extractEmploymentType(text: string) {
  const m = text.match(/(?:employment type|vertragsart|beschäftigung):\s*(.+)/i);
  if (m) return m[1].trim();
  if (/full-?time|vollzeit/i.test(text)) return "Full-time";
  if (/part-?time|teilzeit/i.test(text)) return "Part-time";
  if (/\bcontract\b|\bfreelance\b/i.test(text)) return "Contract";
  return "Not specified";
}

function extractLanguages(text: string) {
  const languages: string[] = [];
  if (/\benglish\b/i.test(text)) languages.push("English");
  if (/\bgerman\b|\bdeutsch\b/i.test(text)) languages.push("German");
  if (/\bportugues[e]?\b|\bportugu[eê]s\b/i.test(text)) languages.push("Portuguese");
  if (/\bfrench\b|\bfranzösisch\b/i.test(text)) languages.push("French");
  return languages.length > 0 ? languages : ["English"];
}

function extractSkills(text: string) {
  return knownSkills.filter((skill) => skillMatchers[skill]?.test(text) ?? false);
}

function extractSummary(text: string) {
  // Pegar mais contexto — até 600 chars, priorizando parágrafos com conteúdo real
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 600) return cleaned;
  // Tentar encontrar o início da descrição real (após metadados iniciais)
  const descStart = cleaned.search(/(?:we are looking|we're looking|you will|ihr aufgaben|aufgaben|responsibilities|about the role|the role|join our)/i);
  if (descStart > 0 && descStart < cleaned.length - 200) {
    return cleaned.slice(descStart, descStart + 600).trim();
  }
  return cleaned.slice(0, 600);
}

export function parseJobDescription(text: string): ParsedJob {
  return {
    title:          extractTitle(text),
    company:        extractCompany(text),
    location:       extractLocation(text),
    seniority:      extractSeniority(text),
    workModel:      extractWorkModel(text),
    employmentType: extractEmploymentType(text),
    languages:      extractLanguages(text),
    skills:         extractSkills(text),
    summary:        extractSummary(text),
  };
}

// ─── Match engine ─────────────────────────────────────────────────────────────

export function analyzeJobMatch(job: ParsedJob, profile: CandidateProfile): MatchAnalysis {
  const combinedJobText   = `${job.title} ${job.summary} ${job.skills.join(" ")}`.toLowerCase();
  const profileContext    = `${profile.summary} ${profile.strengthSignals.join(" ")} ${profile.targetRoles.join(" ")} ${profile.cvText} ${profile.coverLetterText}`.toLowerCase();
  const profileSkillSet   = new Set(profile.coreStack.map((s) => s.toLowerCase()));

  // ── Skill match ──────────────────────────────────────────────────────────
  const matchedSkills = job.skills.filter((s) => profileSkillSet.has(s.toLowerCase()));
  const unmatchedSkills = job.skills.filter((s) => !profileSkillSet.has(s.toLowerCase()));
  const skillCoverage = job.skills.length > 0 ? matchedSkills.length / job.skills.length : 0.5;

  let score = Math.round(skillCoverage * 50); // base: até 50 pontos por skill coverage

  // ── Seniority fit (até +15) ───────────────────────────────────────────────
  if (/(senior|lead|sr\.)/i.test(job.seniority) || /(senior|lead)/i.test(job.title)) {
    score += 15;
  } else if (/(mid|principal|staff)/i.test(job.seniority)) {
    score += 8;
  } else if (/junior/i.test(job.seniority)) {
    score -= 5; // overqualified signal
  }

  // ── Location/remote fit (até +10) ────────────────────────────────────────
  if (/remote|germany|hybrid/i.test(job.location) || /remote|germany/i.test(job.workModel)) {
    score += 10;
  } else if (/cologne|köln|bonn|düsseldorf/i.test(job.location)) {
    score += 12; // NRW — distância mínima
  }

  // ── Role type fit (até +12) ───────────────────────────────────────────────
  if (/software|fullstack|full.stack|frontend|backend|engineer|developer|entwickler/i.test(combinedJobText)) {
    score += 10;
  }
  if (/platform|reliability|sre|devops|infrastructure/i.test(combinedJobText)) {
    score += 8;
  }

  // ── Domain signals from profile (até +8) ─────────────────────────────────
  const domainSignals = [
    [/automation|workflow|internal tool/i,           /automation|workflow|internal/i,    6],
    [/reliability|incident|observability/i,           /reliability|incident|observability/i, 6],
    [/leadership|mentoring|cross.functional|platform/i, /leadership|mentoring|platform/i,  4],
    [/research|engineering|information technology/i,  /engineering|production/i,          4],
    // Defense & cybersec — empresas-alvo do perfil
    [/defense|defence|naval|military|aerospace|embedded|firmware|ot |ot-security|critical infrastructure/i,
      /defense|naval|security|embedded|aerospace|critical/i, 8],
    [/cyber|cybersecurity|security operations|soc |pentest|penetration|siem|threat/i,
      /security|cyber|protection|soc/i, 8],
    [/iot|industrial|plc|scada|rtos|real.time|safety.critical|functional safety/i,
      /industrial|embedded|systems|real.time/i, 6],
  ] as [RegExp, RegExp, number][];

  for (const [jobRe, profileRe, pts] of domainSignals) {
    if (jobRe.test(combinedJobText) && profileRe.test(profileContext)) score += pts;
  }

  // ── Language risk (até -6) ────────────────────────────────────────────────
  const requiresGerman = job.languages.includes("German");
  const profileHasGerman = profile.languages.some((l) => /german/i.test(l));
  if (requiresGerman && !profileHasGerman) score -= 6;
  else if (requiresGerman && profileHasGerman) score += 4; // bônus por ter alemão

  // ── Non-relevant domain penalty ───────────────────────────────────────────
  if (/procurement|marketing|sales|customer service|finance(?! team)|human resources/i.test(combinedJobText) &&
      !/software|engineer|developer|platform/i.test(combinedJobText)) {
    score -= 15;
  }

  score = Math.max(32, Math.min(score, 97));

  // ── Timing bonus (até +5) — vagas recentes têm leve prioridade ──────────────
  // O caller pode passar postedAt para aplicar o bônus
  // Aplicado externamente via adjustScoreForTiming()

  // ── Strengths (dinâmico) ─────────────────────────────────────────────────
  const strengths: string[] = [];

  if (matchedSkills.length > 0) {
    strengths.push(`Match técnico direto: ${matchedSkills.slice(0, 4).join(", ")}.`);
  } else {
    strengths.push("Experiência full stack e de produção cobre a base técnica esperada.");
  }

  if (/(senior|lead)/i.test(job.seniority) || /(senior|lead)/i.test(job.title)) {
    strengths.push("Nível de senioridade alinhado com histórico de 10+ anos em produção.");
  }

  if (/defense|naval|military|aerospace|embedded|firmware/i.test(combinedJobText)) {
    strengths.push("Perfil alinhado com setor de defesa — engenharia de sistemas críticos e segurança.");
  } else if (/cyber|cybersecurity|soc |pentest|threat|siem/i.test(combinedJobText)) {
    strengths.push("Background técnico em segurança e sistemas de produção — fit com o escopo de cyber.");
  } else if (/automation|workflow|internal/i.test(combinedJobText)) {
    strengths.push("Histórico forte com automação e ferramentas internas — fit direto com a vaga.");
  } else if (/reliability|observability|incident/i.test(combinedJobText)) {
    strengths.push("Experiência com confiabilidade e incident response relevante para o escopo.");
  } else {
    strengths.push("Perfil cross-functional com foco em entrega, qualidade e colaboração.");
  }

  if (/(remote|germany|hybrid)/i.test(job.location) || requiresGerman && profileHasGerman) {
    strengths.push(requiresGerman && profileHasGerman
      ? "Alemão disponível — reduz risco de filtro de idioma."
      : "Localização ou modelo de trabalho compatível com situação atual.");
  }

  // ── Risks (dinâmico) ─────────────────────────────────────────────────────
  const risks: string[] = [];

  if (unmatchedSkills.length > 2) {
    risks.push(`Stack não coberta no match: ${unmatchedSkills.slice(0, 3).join(", ")} — vale verificar a exigência real.`);
  } else if (unmatchedSkills.length > 0) {
    risks.push(`${unmatchedSkills.join(", ")} não apareceu no perfil — gap administrável.`);
  }

  if (requiresGerman && !profileHasGerman) {
    risks.push("Alemão exigido e não declarado no perfil — pode ser filtro no processo.");
  } else if (requiresGerman) {
    risks.push("Alemão listado como requisito — confirmar nível mínimo esperado pela equipe.");
  }

  if (/staff|principal/i.test(job.seniority)) {
    risks.push("Escopo Staff/Principal pode exigir amplitude de influência maior — revisar expectativa.");
  } else if (/junior/i.test(job.seniority)) {
    risks.push("Vaga Junior — overqualified signal pode ser obstáculo no processo.");
  }

  if (risks.length === 0) {
    risks.push("Sem riscos críticos identificados — perfil cobre os principais requisitos.");
  }

  const verdict =
    score >= 78 ? "Alta prioridade" :
    score >= 62 ? "Boa aderência" :
                  "Aderência parcial";

  return { score, verdict, strengths, risks };
}


// ─── Timing score adjustment ─────────────────────────────────────────────────

export function adjustScoreForTiming(
  baseScore: number,
  postedAt?: string | null,
): number {
  if (!postedAt) return baseScore;

  const days = Math.floor(
    (Date.now() - new Date(postedAt).getTime()) / 86400000,
  );

  // Bonus: vagas novas (≤3d) +5, recentes (≤7d) +3, normais (≤21d) +0
  // Penalty: vagas velhas (>45d) -5 (podem estar preenchidas)
  if (days <= 3)  return Math.min(baseScore + 5, 97);
  if (days <= 7)  return Math.min(baseScore + 3, 97);
  if (days <= 21) return baseScore;
  if (days > 45)  return Math.max(baseScore - 5, 32);
  return baseScore;
}

// ─── Gap analysis ─────────────────────────────────────────────────────────────

export type GapAnalysis = {
  missingSkills: { skill: string; severity: "critical" | "minor"; suggestion: string }[];
  languageGap: { language: string; note: string } | null;
  seniorityGap: { expected: string; note: string } | null;
  nextStep: string;
};

export function analyzeGap(job: ParsedJob, profile: CandidateProfile, analysis: MatchAnalysis): GapAnalysis {
  const profileSkillSet = new Set(profile.coreStack.map((s) => s.toLowerCase()));
  const missingSkills: GapAnalysis["missingSkills"] = [];

  for (const skill of job.skills) {
    if (profileSkillSet.has(skill.toLowerCase())) continue;

    // Verificar se há skill equivalente/próxima no perfil
    const equivalents: Record<string, string[]> = {
      "Kubernetes": ["Docker"],
      "Go":         ["TypeScript", "Node.js"],
      "Rust":       ["C#", "TypeScript"],
      "Azure":      ["AWS"],
      "GCP":        ["AWS"],
      "Vue.js":     ["React"],
      "Angular":    ["React"],
      "GraphQL":    ["REST APIs"],
      "gRPC":       ["REST APIs"],
      "MySQL":      ["PostgreSQL", "SQL"],
      "MongoDB":    ["PostgreSQL", "SQL"],
      "GitLab CI":  ["GitHub Actions", "CI/CD"],
      "Ansible":    ["Docker", "CI/CD"],
      "Terraform":  ["AWS", "Docker"],
    };

    const equivalentInProfile = equivalents[skill]?.find((eq) =>
      profileSkillSet.has(eq.toLowerCase())
    );

    const isCritical = job.skills.indexOf(skill) < 3; // primeiros 3 skills costumam ser core

    let suggestion = "";
    if (equivalentInProfile) {
      suggestion = `Você tem ${equivalentInProfile} — posicione como base para ${skill}`;
    } else {
      suggestion = `Não há equivalente direto — mencionar disposição de aprender pode ajudar`;
    }

    missingSkills.push({
      skill,
      severity: isCritical ? "critical" : "minor",
      suggestion,
    });
  }

  // Language gap
  let languageGap: GapAnalysis["languageGap"] = null;
  const requiresGerman = job.languages.includes("German");
  const hasGerman = profile.languages.some((l) => /german/i.test(l));
  if (requiresGerman && !hasGerman) {
    languageGap = {
      language: "German",
      note: "Alemão listado como requisito — não declarado no perfil. Se tiver nível B1+, vale mencionar explicitamente.",
    };
  }

  // Seniority gap
  let seniorityGap: GapAnalysis["seniorityGap"] = null;
  if (/staff|principal/i.test(job.seniority)) {
    seniorityGap = {
      expected: job.seniority,
      note: "Escopo Staff/Principal costuma exigir influência em múltiplas equipes — vale calibrar a abordagem para esse nível.",
    };
  } else if (/junior/i.test(job.seniority)) {
    seniorityGap = {
      expected: "Junior",
      note: "Vaga Junior com perfil Senior — overqualified pode ser um obstáculo. Considere mencionar foco em entrega e não em hierarquia.",
    };
  }

  // Next step recommendation
  let nextStep = "";
  if (analysis.score >= 78) {
    nextStep = "Score forte — preparar recruiter message e aplicar esta semana.";
  } else if (analysis.score >= 62) {
    if (missingSkills.some((s) => s.severity === "critical")) {
      nextStep = `Gap em ${missingSkills.find((s) => s.severity === "critical")?.skill} — endereçar na mensagem ou preparar para discutir na entrevista.`;
    } else {
      nextStep = "Boa aderência — personalizar a abordagem destacando os pontos de match mais fortes.";
    }
  } else {
    nextStep = "Aderência parcial — revisar se vale o esforço ou manter no radar para monitorar evolução.";
  }

  return { missingSkills, languageGap, seniorityGap, nextStep };
}

// ─── Recruiter message ───────────────────────────────────────────────────────

type MessageLang = "en" | "de" | "pt";

export function buildRecruiterMessage(
  job: ParsedJob,
  profile: CandidateProfile,
  analysis: MatchAnalysis,
  lang: MessageLang = "en",
): string {
  const stack = profile.coreStack.slice(0, 4).join(", ");
  const coverFocus = profile.coverLetterText.replace(/\s+/g, " ").trim().slice(0, 200);

  if (lang === "de") {
    return `Guten Tag,

ich bin auf die Position ${job.title} bei ${job.company} aufmerksam geworden und sehe eine starke Übereinstimmung mit meinem Profil. Als ${profile.headline} mit Sitz in ${profile.location} bringe ich über 10 Jahre Erfahrung in der Entwicklung und dem Betrieb von Produktionsanwendungen mit ${stack} mit.

In meiner bisherigen Arbeit habe ich mich auf interne Plattformen, Workflow-Automatisierung und zuverlässige Systeme konzentriert. Die Stelle passt gut zu meinem Erfahrungshintergrund — aktueller Match-Score im Argus: ${analysis.score}%.

${coverFocus.length > 0 ? `${coverFocus}\n\n` : ""}Ich würde mich freuen, mehr über die Rolle zu erfahren und meine Eignung im Detail zu besprechen.`;
  }

  if (lang === "pt") {
    return `Olá,

Encontrei a vaga ${job.title} na ${job.company} e ela está muito alinhada com meu perfil. Sou ${profile.headline} baseado em ${profile.location} com 10+ anos de experiência desenvolvendo e operando aplicações de produção com ${stack}.

No meu trabalho recente, foquei em plataformas internas, automação de workflows e sistemas confiáveis. A vaga se destaca pelo alinhamento com minha experiência — score atual no Argus: ${analysis.score}%.

${coverFocus.length > 0 ? `${coverFocus}\n\n` : ""}Se a equipe busca alguém que entrega rápido com foco em qualidade e clareza operacional, ficaria feliz em conversar.`;
  }

  // English (default)
  return `Hi,

I came across the ${job.title} role at ${job.company} and it looks strongly aligned with my background. I am a ${profile.headline} based in ${profile.location} with 10+ years of experience building and maintaining production applications using ${stack}.

My recent work has focused on internal platforms, workflow automation and reliable systems — the role stands out for its fit with that experience. Current match score in Argus: ${analysis.score}%.

${coverFocus.length > 0 ? `${coverFocus}\n\n` : ""}If the team is looking for someone who can contribute quickly with a focus on delivery quality and operational clarity, I would be glad to connect.`;
}

// ─── Custom cover letter paragraph ────────────────────────────────────────────

export type CoverLang = "en" | "de" | "pt";

export function buildCustomCoverParagraph(
  job: ParsedJob,
  profile: CandidateProfile,
  analysis: MatchAnalysis,
  lang: CoverLang = "en",
): string {
  const topSkills = analysis.strengths[0] ?? "";
  const topMatch  = job.skills.slice(0, 3).join(", ");
  const hasGerman = profile.languages.some((l) => /german/i.test(l));

  if (lang === "de") {
    return `Ihre Stelle als ${job.title} bei ${job.company} passt sehr gut zu meinen Erfahrungsschwerpunkten in ${topMatch || "der Fullstack-Entwicklung"}. ${topSkills} Ich bin in ${profile.location} ansässig${hasGerman ? " und kommuniziere täglich auf Deutsch" : ""} und bin an dieser Position besonders interessiert, weil sie die Kombination aus technischer Tiefe und operativer Wirkung verkörpert, die ich in meiner nächsten Rolle anstrebe.`;
  }

  if (lang === "pt") {
    return `A vaga de ${job.title} na ${job.company} é um match direto com minha experiência em ${topMatch || "desenvolvimento fullstack"}. ${topSkills} Estou baseado em ${profile.location} e busco exatamente o tipo de papel que combina profundidade técnica com impacto operacional real — o que essa vaga representa.`;
  }

  // EN default
  return `The ${job.title} role at ${job.company} aligns directly with my experience in ${topMatch || "fullstack engineering"}. ${topSkills} Based in ${profile.location}, I am looking for exactly the kind of role that combines technical depth with real operational impact — which is what this position represents.`;
}
