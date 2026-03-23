// ─── Interview preparation engine ─────────────────────────────────────────────
// Gera checklist e perguntas de preparação baseadas na vaga e no perfil.

import type { ParsedJob } from "@/lib/job-intake";
import type { CandidateProfile } from "@/lib/profile";

export type InterviewQuestion = {
  category: "technical" | "behavioral" | "company" | "role";
  question: string;
  hint: string;
};

export type InterviewPrep = {
  questions: InterviewQuestion[];
  researchChecklist: string[];
  talkingPoints: string[];
  redFlags: string[];
};

export function buildInterviewPrep(
  job: ParsedJob,
  profile: CandidateProfile,
): InterviewPrep {
  const questions: InterviewQuestion[] = [];
  const profileSkills = new Set(profile.coreStack.map((s) => s.toLowerCase()));

  // ── Technical questions based on job stack ────────────────────────────────
  for (const skill of job.skills.slice(0, 5)) {
    questions.push({
      category: "technical",
      question: `How have you used ${skill} in a production environment?`,
      hint: `Be specific: scale, problem solved, lessons learned. Mention ${profileSkills.has(skill.toLowerCase()) ? "your direct experience" : "adjacent experience and learning plan"}.`,
    });
  }

  // ── Behavioral questions ──────────────────────────────────────────────────
  const behaviorals: InterviewQuestion[] = [
    {
      category: "behavioral",
      question: "Tell me about a time you debugged a critical production issue.",
      hint: "Use STAR. Quantify impact: downtime, users affected, resolution time. Emphasise root cause analysis.",
    },
    {
      category: "behavioral",
      question: "Describe a project where you had to balance technical debt with delivery speed.",
      hint: "Show engineering judgment. Mention the trade-off decision, stakeholder communication and outcome.",
    },
    {
      category: "behavioral",
      question: "How do you handle disagreements with a tech lead or architect on design decisions?",
      hint: "Show constructive conflict resolution. Mention data, prototypes or documented trade-offs used to align.",
    },
  ];

  if (/automation|workflow/i.test(job.summary)) {
    behaviorals.push({
      category: "behavioral",
      question: "Walk me through an automation you built that saved significant time.",
      hint: "Quantify: hours/week saved, error rate reduction, team adoption. Show end-to-end ownership.",
    });
  }

  if (/leadership|mentoring|lead/i.test(job.summary)) {
    behaviorals.push({
      category: "behavioral",
      question: "How do you approach technical mentoring for junior engineers?",
      hint: "Show empathy + structure. Mention code review style, pairing sessions, documentation habits.",
    });
  }

  questions.push(...behaviorals);

  // ── Role-specific questions ───────────────────────────────────────────────
  if (/platform|infrastructure|devops/i.test(job.title + " " + job.summary)) {
    questions.push({
      category: "role",
      question: "How do you approach reliability engineering — SLIs, SLOs, error budgets?",
      hint: "Show familiarity with the reliability stack. If not formal, describe how you'd apply the concepts.",
    });
  }

  if (/fullstack|full.stack/i.test(job.title)) {
    questions.push({
      category: "role",
      question: "How do you decide where to put business logic — backend, frontend, or BFF?",
      hint: "Show architectural judgment. Security, caching, latency and team ownership are the key axes.",
    });
  }

  // ── Company research checklist ────────────────────────────────────────────
  const researchChecklist = [
    `${job.company} — main products and business model`,
    `${job.company} — engineering blog, tech stack and open source contributions`,
    `${job.company} — recent news, funding rounds or major announcements`,
    `${job.company} — culture, values and employer reviews (Glassdoor, kununu)`,
    `${job.company} — team structure for this role (engineering org size, reporting)`,
    "Prepare 3 thoughtful questions to ask the interviewer",
    "Review your own CV — any gaps or items likely to be challenged",
  ];

  // ── Talking points (what to emphasise) ────────────────────────────────────
  const talkingPoints: string[] = [
    `10+ years in production — emphasise reliability, ownership and delivery record`,
    `${profile.location} — no relocation needed, already integrated in Germany`,
  ];

  if (job.skills.some((s) => profileSkills.has(s.toLowerCase()))) {
    talkingPoints.push(
      `Direct stack match on ${job.skills.filter((s) => profileSkills.has(s.toLowerCase())).slice(0, 3).join(", ")} — have concrete examples ready`,
    );
  }

  if (/automation/i.test(job.summary)) {
    talkingPoints.push("Automation track record — quantify with specific examples from past projects");
  }

  // ── Red flags to watch for in the interview ───────────────────────────────
  const redFlags: string[] = [];

  if (/german/i.test(job.languages.join(","))) {
    redFlags.push("Clarify actual German language requirement — spoken daily vs written docs");
  }

  if (/startup/i.test(job.summary)) {
    redFlags.push("Clarify equity, runway, burn rate if startup — ask about funding stage");
  }

  if (/staff|principal/i.test(job.seniority)) {
    redFlags.push("Clarify scope of Staff level — system-wide influence or single team?");
  }

  redFlags.push("Ask about on-call expectations and incident frequency");
  redFlags.push("Clarify hybrid/remote policy in practice vs. stated in JD");

  return { questions, researchChecklist, talkingPoints, redFlags };
}
