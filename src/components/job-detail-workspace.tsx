"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/context";
import { useEffect, useMemo, useState } from "react";
import {
  analyzeJobMatch,
  buildRecruiterMessage,
  type MatchAnalysis,
} from "@/lib/job-intake";
import {
  deriveCandidateProfile,
  type CandidateProfile,
} from "@/lib/profile";
import {
  createHistoryEntry,
  STATUS_OPTIONS,
  type TrackedJob,
} from "@/lib/radar-types";

const STORAGE_KEY = "argus-workbench-state";

type JobDetailWorkspaceProps = {
  jobId: string;
  profile: CandidateProfile;
};

type RadarPayload = {
  available: boolean;
  reason?: string | null;
  jobs: TrackedJob[];
};

function badgeStyle(score: number): React.CSSProperties {
  if (score >= 78) return { background: "rgba(16,185,129,.15)", color: "#10b981", outline: "1px solid rgba(16,185,129,.3)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 };
  if (score >= 60) return { background: "rgba(245,158,11,.15)", color: "#f59e0b", outline: "1px solid rgba(245,158,11,.3)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 };
  return { background: "rgba(239,68,68,.15)", color: "#ef4444", outline: "1px solid rgba(239,68,68,.3)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 };
}

function statusStyle(status: string): React.CSSProperties {
  if (status === "Entrevista") return { background: "rgba(16,185,129,.15)", color: "#10b981", outline: "1px solid rgba(16,185,129,.3)" };
  if (status === "Aplicada" || status === "Aplicar") return { background: "rgba(59,130,246,.15)", color: "#60a5fa", outline: "1px solid rgba(59,130,246,.3)" };
  if (status === "Pronta para revisar") return { background: "rgba(139,92,246,.15)", color: "#a78bfa", outline: "1px solid rgba(139,92,246,.3)" };
  return { background: "rgba(148,163,184,.1)", color: "var(--muted)", outline: "1px solid var(--border)" };
}


function readStoredJobs(): TrackedJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { trackedJobs?: TrackedJob[] };
    return parsed.trackedJobs ?? [];
  } catch {
    return [];
  }
}

function readStoredDocuments(baseProfile: CandidateProfile) {
  if (typeof window === "undefined") {
    return { cvText: baseProfile.cvText, coverLetterText: baseProfile.coverLetterText };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { cvText: baseProfile.cvText, coverLetterText: baseProfile.coverLetterText };
    const parsed = JSON.parse(raw) as { cvText?: string; coverLetterText?: string };
    return {
      cvText: parsed.cvText ?? baseProfile.cvText,
      coverLetterText: parsed.coverLetterText ?? baseProfile.coverLetterText,
    };
  } catch {
    return { cvText: baseProfile.cvText, coverLetterText: baseProfile.coverLetterText };
  }
}

function updateStoredJob(nextJob: TrackedJob) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { trackedJobs?: TrackedJob[] };
    const trackedJobs = (parsed.trackedJobs ?? []).map((job) =>
      job.id === nextJob.id ? nextJob : job,
    );
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...parsed, trackedJobs, activeTrackedJobId: nextJob.id }),
    );
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function formatDate(val?: string | null) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export function JobDetailWorkspace({ jobId, profile }: JobDetailWorkspaceProps) {
  const t = useT();
  const [job, setJob] = useState<TrackedJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState(t("global.loading"));
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "match" | "message" | "history">("overview");

  const { cvText, coverLetterText } = useMemo(
    () => readStoredDocuments(profile),
    [profile],
  );

  const activeProfile = useMemo(
    () => deriveCandidateProfile(profile, { cvText, coverLetterText }),
    [coverLetterText, cvText, profile],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadJob() {
      try {
        const response = await fetch("/api/radar/jobs", { cache: "no-store" });
        const payload = (await response.json()) as RadarPayload;
        if (!isMounted) return;

        const persisted = payload.jobs.find((j) => j.id === jobId);
        if (response.ok && payload.available && persisted) {
          setJob(persisted);
          setSyncMessage("Sincronizado com o radar");
          setIsLoading(false);
          return;
        }

        const local = readStoredJobs().find((j) => j.id === jobId);
        if (local) {
          setJob(local);
          setSyncMessage("Carregado do estado local");
          setIsLoading(false);
          return;
        }

        setSyncMessage("Vaga não encontrada no radar");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        const local = readStoredJobs().find((j) => j.id === jobId);
        if (local) {
          setJob(local);
          setSyncMessage("Carregado localmente");
        } else {
          setSyncMessage("Falha ao carregar");
        }
        setIsLoading(false);
      }
    }

    void loadJob();
    return () => { isMounted = false; };
  }, [jobId]);

  const analysis = useMemo<MatchAnalysis | null>(() => {
    if (!job) return null;
    return analyzeJobMatch(job, activeProfile);
  }, [activeProfile, job]);

  const recruiterMessage = useMemo(() => {
    if (!job || !analysis) return "";
    return buildRecruiterMessage(job, activeProfile, analysis);
  }, [activeProfile, analysis, job]);

  async function handleStatusChange(nextStatus: string) {
    if (!job) return;
    const status = nextStatus as TrackedJob["status"];
    const nextJob: TrackedJob = {
      ...job,
      status,
      updatedAt: new Date().toISOString(),
      history:
        job.status === status
          ? job.history
          : [createHistoryEntry(status), ...job.history].slice(0, 12),
    };
    setJob(nextJob);
    updateStoredJob(nextJob);

    if (!job.createdAt) { setSyncMessage("Status atualizado localmente"); return; }

    try {
      const response = await fetch(`/api/radar/jobs/${job.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) { setSyncMessage("Falha ao sincronizar status"); return; }
      const payload = (await response.json()) as { job: TrackedJob };
      setJob(payload.job);
      updateStoredJob(payload.job);
      setSyncMessage("Status sincronizado");
    } catch {
      setSyncMessage("Falha ao sincronizar status");
    }
  }

  async function handleCopy() {
    if (!recruiterMessage) return;
    await navigator.clipboard.writeText(recruiterMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-5 py-8 text-[13px]" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--dim)" }}>
        <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--gold)" }} />
        {syncMessage}
      </div>
    );
  }

  // Not found
  if (!job || !analysis) {
    return (
      <div className="rounded-[28px] p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
          Job Detail
        </p>
        <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--text)" }}>{t("job.notFound")}</h2>
        <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--dim)" }}>
          {t("job.notFoundHint")}
        </p>
        <div className="mt-5 flex gap-2.5">
          <Link
            href="/jobs"
            className="rounded-full px-4 py-2 text-[13px] font-semibold transition"
            style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
          >
            {t("digests.backToJobs")}
          </Link>
          <Link
            href="/control-center"
            className="rounded-full px-4 py-2 text-[13px] font-semibold transition"
            style={{ background: "transparent", color: "var(--dim)", border: "1px solid var(--border)" }}
          >
            Control center
          </Link>
        </div>
      </div>
    );
  }

  const scoreWidth = `${Math.max(8, Math.min(analysis.score, 100))}%`;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="overflow-hidden rounded-[28px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--gold)" }} />
            <span className="text-[11px]" style={{ color: "var(--dim)" }}>{syncMessage}</span>
          </div>
          <span className="text-[11px] font-medium" style={{ color: "var(--dim)" }}>{job.intakeMode}</span>
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--gold)" }}>
                {t("job.inFocus")}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                {job.title}
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: "var(--dim)" }}>
                {job.company} · {job.location} · {job.seniority}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span style={badgeStyle(analysis.score)} className="rounded-full px-3 py-1.5 text-[13px] font-bold">
                {analysis.score}%
              </span>
              <span style={statusStyle(job.status)} className="rounded-full px-3 py-1.5 text-[11px] font-bold">
                {job.status}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-5 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(148,163,184,.1)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: scoreWidth, background: "var(--gold)" }} />
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { l: "Modelo", v: job.workModel },
              { l: "Contrato", v: job.employmentType },
              { l: "Idiomas", v: job.languages.join(", ") || "—" },
              { l: "Veredito", v: analysis.verdict },
            ].map((item) => (
              <div key={item.l} className="rounded-2xl px-4 py-3" style={{ background: "var(--surf)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--dim)" }}>{item.l}</p>
                <p className="mt-1.5 text-[13px] font-semibold" style={{ color: "var(--text)" }}>{item.v || "—"}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            {job.sourceUrl ? (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold transition hover:opacity-80"
                style={{ background: "var(--gold)", color: "#000" }}
              >
                {t("job.apply")}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px]" style={{ color: "var(--dim)", border: "1px solid var(--border)" }}>
                {t("job.noLink")}
              </span>
            )}
            <Link
              href={`/control-center?job=${encodeURIComponent(job.id)}`}
              className="rounded-full px-4 py-2 text-[12px] font-semibold transition"
              style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              {t("job.analyzeInCC")}
            </Link>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-full px-4 py-2 text-[12px] font-semibold transition"
              style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              {copied ? t("global.copied") : t("cc.copyMessage")}
            </button>
            <select
              value={job.status}
              onChange={(e) => void handleStatusChange(e.target.value)}
              className="rounded-full px-4 py-2 text-[12px] font-semibold outline-none transition"
              style={{ background: "var(--surf)", color: "var(--text)", border: "1px solid var(--border)" }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} style={{ background: "var(--card)", color: "var(--text)" }}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 overflow-x-auto rounded-full p-1" style={{ background: "var(--surf)", border: "1px solid var(--border)", scrollbarWidth: "none" }}>
        {(["overview", "match", "message", "history"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="flex-1 rounded-full py-2 text-[12px] font-semibold transition"
            style={activeTab === tab
              ? { background: "var(--gold)", color: "#000" }
              : { color: "var(--muted)" }
            }
          >
            {tab === "overview" ? t("cc.tabSummary") : tab === "match" ? "Match" : tab === "message" ? "Mensagem" : t("cc.tabHistory")}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[1.1fr_0.9fr]">
          {/* Summary + skills */}
          <div className="rounded-[24px] p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Resumo
            </p>
            <p className="mt-3 text-[13px] leading-7" style={{ color: "var(--muted)" }}>{job.summary || t("job.noSummary")}</p>
            {job.skills.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <a
                      key={skill}
                      href={`/jobs?q=${encodeURIComponent(skill)}`}
                      className="rounded-full px-2.5 py-1 text-[12px] transition"
                      style={{ background: "var(--surf)", color: "var(--text)", border: "1px solid var(--border)" }}
                      title={`Filtrar vagas com ${skill}`}
                    >
                      {skill}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Metadata */}
          <div className="space-y-3">
            {[
              { label: t("job.seniority"), value: job.seniority },
              { label: t("job.workModel"), value: job.workModel },
              { label: t("job.contract"), value: job.employmentType },
              { label: t("job.languages"), value: job.languages.join(", ") || t("job.notDetected") },
              { label: t("job.origin"), value: job.intakeMode },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl px-4 py-3.5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--dim)" }}>{item.label}</p>
                <p className="mt-1 text-[14px] font-semibold" style={{ color: "var(--text)" }}>{item.value || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "match" && (
        <div className="space-y-3">
          {/* Decisão */}
          <div className="rounded-[24px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Veredito</p>
                <p className="mt-1 text-[15px] font-semibold" style={{ color: "var(--text)" }}>{analysis.verdict}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span style={badgeStyle(analysis.score)} className="rounded-full px-3 py-1 text-[14px] font-bold">
                  {analysis.score}%
                </span>
                {job.sourceUrl && (
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold"
                    style={{ color: "var(--gold)" }}
                  >
                    Aplicar ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Forças e riscos */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] p-5" style={{ background: "var(--card)", border: "1px solid rgba(16,185,129,.25)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#10b981" }}>
                {t("job.whyMatch")}
              </p>
              <div className="mt-3 space-y-2">
                {analysis.strengths.length === 0 ? (
                  <p className="text-[13px]" style={{ color: "var(--dim)" }}>{t("cc.noStrengths")}</p>
                ) : (
                  analysis.strengths.map((s) => (
                    <div key={s} className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5" style={{ background: "var(--surf)", border: "1px solid rgba(16,185,129,.2)" }}>
                      <span className="mt-0.5 shrink-0" style={{ color: "#10b981" }}>✓</span>
                      <p className="text-[13px] leading-5" style={{ color: "var(--muted)" }}>{s}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-[24px] p-5" style={{ background: "var(--card)", border: "1px solid rgba(245,158,11,.25)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#f59e0b" }}>
                {t("job.gapsToAddress")}
              </p>
              <div className="mt-3 space-y-2">
                {analysis.risks.length === 0 ? (
                  <p className="text-[13px]" style={{ color: "var(--dim)" }}>{t("job.noGaps")}</p>
                ) : (
                  analysis.risks.map((r) => (
                    <div key={r} className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5" style={{ background: "var(--surf)", border: "1px solid rgba(245,158,11,.2)" }}>
                      <span className="mt-0.5 shrink-0" style={{ color: "#f59e0b" }}>⚠</span>
                      <p className="text-[13px] leading-5" style={{ color: "var(--muted)" }}>{r}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Próximo passo */}
          <div className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>{t("job.nextStep")}</p>
              <p className="mt-1 text-[13px] font-medium" style={{ color: "var(--text)" }}>
                {analysis.score >= 80
                  ? t("job.highPriority")
                  : analysis.score >= 65
                  ? t("job.goodOpportunity")
                  : t("job.partialMatch")}
              </p>
            </div>
            {job.sourceUrl && (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition hover:opacity-80"
                style={{ background: "var(--gold)", color: "#000" }}
              >
                Aplicar ↗
              </a>
            )}
          </div>
        </div>
      )}

      {activeTab === "message" && (
        <div className="rounded-[24px] p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Mensagem para recruiter
            </p>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-full px-4 py-1.5 text-[12px] font-semibold transition"
              style={{ background: "transparent", color: "var(--gold)", border: "1px solid rgba(245,158,11,.3)" }}
            >
              {copied ? t("global.copied") : t("global.copy")}
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-2xl p-5 text-[13px] leading-6 font-sans" style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {recruiterMessage}
          </pre>
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-[24px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            Histórico de status
          </p>
          <div className="space-y-2">
            {job.history.length === 0 ? (
              <p className="text-[13px]" style={{ color: "var(--dim)" }}>{t("job.noHistory")}</p>
            ) : (
              job.history.map((entry, i) => (
                <div
                  key={`${entry.status}-${entry.changedAt}-${i}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "var(--surf)", border: "1px solid var(--border)" }}
                >
                  <span style={statusStyle(entry.status)} className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {entry.status}
                  </span>
                  <span className="flex-1 text-[12px]" style={{ color: "var(--dim)" }}>{entry.note ?? ""}</span>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--dim)" }}>{formatDate(entry.changedAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
