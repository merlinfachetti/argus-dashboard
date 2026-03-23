"use client";

import Link from "next/link";
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
  if (score >= 78) return { background: "#ecfdf5", color: "#047857", outline: "1px solid #a7f3d0" };
  if (score >= 60) return { background: "#fffbeb", color: "#b45309", outline: "1px solid #fde68a" };
  return { background: "#fff1f2", color: "#be123c", outline: "1px solid #fecdd3" };
}

function statusStyle(status: string): React.CSSProperties {
  if (status === "Entrevista") return { background: "#ecfdf5", color: "#047857", outline: "1px solid #a7f3d0" };
  if (status === "Aplicada" || status === "Aplicar") return { background: "#eff6ff", color: "#1d4ed8", outline: "1px solid #bfdbfe" };
  if (status === "Pronta para revisar") return { background: "#f5f3ff", color: "#6d28d9", outline: "1px solid #ddd6fe" };
  return { background: "#f1f5f9", color: "#334155", outline: "1px solid #cbd5e1" };
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
  const [job, setJob] = useState<TrackedJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState("Carregando...");
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
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white px-5 py-8 text-[13px] text-slate-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
        {syncMessage}
      </div>
    );
  }

  // Not found
  if (!job || !analysis) {
    return (
      <div className="rounded-[28px] border border-slate-200/60 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Job Detail
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Vaga não encontrada</h2>
        <p className="mt-2 text-[13px] leading-6 text-slate-500">
          Esta vaga não apareceu no radar persistido nem no estado local. Volte ao explorer.
        </p>
        <div className="mt-5 flex gap-2.5">
          <Link
            href="/jobs"
            className="rounded-full bg-slate-950 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800"
          >
            Voltar para jobs
          </Link>
          <Link
            href="/control-center"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
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
      <div className="overflow-hidden rounded-[28px] border border-slate-900/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span className="text-[11px] text-slate-400">{syncMessage}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">{job.intakeMode}</span>
        </div>

        <div className="px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400">
                Vaga em foco
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {job.title}
              </h1>
              <p className="mt-1 text-[13px] text-slate-400">
                {job.company} · {job.location} · {job.seniority}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span style={badgeStyle(analysis.score)} className="rounded-full px-3 py-1.5 text-[13px] font-bold">
                {analysis.score}%
              </span>
              <span style={statusStyle(job.status)} className="rounded-full px-3 py-1.5 text-[11px] font-bold">
                {job.status}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: scoreWidth }} />
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { l: "Modelo", v: job.workModel },
              { l: "Contrato", v: job.employmentType },
              { l: "Idiomas", v: job.languages.join(", ") || "—" },
              { l: "Veredito", v: analysis.verdict },
            ].map((item) => (
              <div key={item.l} className="rounded-2xl border border-white/[0.07] bg-white/[0.05] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.l}</p>
                <p className="mt-1.5 text-[13px] font-semibold text-slate-100">{item.v || "—"}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/control-center?job=${encodeURIComponent(job.id)}`}
              className="rounded-full bg-sky-500 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-sky-400"
            >
              Operar no CC
            </Link>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[12px] font-semibold text-slate-200 transition hover:bg-white/[0.12]"
            >
              {copied ? "✓ Copiado" : "Copiar mensagem"}
            </button>
            {job.sourceUrl && (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[12px] font-semibold text-slate-300 transition hover:bg-white/[0.12]"
              >
                Vaga original ↗
              </a>
            )}
            <select
              value={job.status}
              onChange={(e) => void handleStatusChange(e.target.value)}
              className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[12px] font-semibold text-slate-200 outline-none transition hover:bg-white/[0.12]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="text-slate-950">{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 rounded-full border border-slate-200 bg-slate-50 p-1">
        {(["overview", "match", "message", "history"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              "flex-1 rounded-full py-2 text-[12px] font-semibold transition",
              activeTab === tab
                ? "bg-white text-slate-950 shadow-[0_2px_8px_rgba(15,23,42,0.10)]"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {tab === "overview" ? "Resumo" : tab === "match" ? "Match" : tab === "message" ? "Mensagem" : "Histórico"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Summary + skills */}
          <div className="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Resumo
            </p>
            <p className="mt-3 text-[13px] leading-7 text-slate-600">{job.summary || "Sem resumo disponível."}</p>
            {job.skills.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Metadata */}
          <div className="space-y-3">
            {[
              { label: "Senioridade", value: job.seniority },
              { label: "Modelo de trabalho", value: job.workModel },
              { label: "Tipo de contrato", value: job.employmentType },
              { label: "Idiomas requeridos", value: job.languages.join(", ") || "Não detectados" },
              { label: "Origem", value: job.intakeMode },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200/60 bg-white px-4 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-1 text-[14px] font-semibold text-slate-950">{item.value || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "match" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] border border-emerald-200/60 bg-gradient-to-b from-emerald-50/60 to-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              O que favorece
            </p>
            <div className="mt-3 space-y-2">
              {analysis.strengths.length === 0 ? (
                <p className="text-[13px] text-slate-400">Nenhum ponto de força identificado.</p>
              ) : (
                analysis.strengths.map((s) => (
                  <div key={s} className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-white px-3.5 py-3">
                    <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                    <p className="text-[13px] leading-5 text-slate-700">{s}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-[24px] border border-amber-200/60 bg-gradient-to-b from-amber-50/60 to-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600">
              Pontos de atenção
            </p>
            <div className="mt-3 space-y-2">
              {analysis.risks.length === 0 ? (
                <p className="text-[13px] text-slate-400">Nenhum risco identificado.</p>
              ) : (
                analysis.risks.map((r) => (
                  <div key={r} className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-white px-3.5 py-3">
                    <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
                    <p className="text-[13px] leading-5 text-slate-600">{r}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "message" && (
        <div className="rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Mensagem para recruiter
            </p>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-full bg-slate-950 px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-5 text-[13px] leading-6 text-slate-700 font-sans">
            {recruiterMessage}
          </pre>
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Histórico de status
          </p>
          <div className="space-y-2">
            {job.history.length === 0 ? (
              <p className="text-[13px] text-slate-400">Sem histórico ainda.</p>
            ) : (
              job.history.map((entry, i) => (
                <div
                  key={`${entry.status}-${entry.changedAt}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span style={statusStyle(entry.status)} className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {entry.status}
                  </span>
                  <span className="flex-1 text-[12px] text-slate-500">{entry.note ?? ""}</span>
                  <span className="text-[11px] tabular-nums text-slate-400">{formatDate(entry.changedAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
