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

function badgeTone(score: number) {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (score >= 65) return "bg-sky-100 text-sky-700 ring-sky-200";
  return "bg-amber-100 text-amber-700 ring-amber-200";
}

function statusTone(status: TrackedJob["status"]) {
  if (status === "Entrevista") {
    return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  }

  if (status === "Aplicada" || status === "Aplicar") {
    return "bg-sky-100 text-sky-800 ring-sky-200";
  }

  if (status === "Pronta para revisar") {
    return "bg-violet-100 text-violet-800 ring-violet-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function readStoredJobs() {
  if (typeof window === "undefined") {
    return [] as TrackedJob[];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [] as TrackedJob[];
  }

  try {
    const parsed = JSON.parse(raw) as { trackedJobs?: TrackedJob[] };
    return parsed.trackedJobs ?? [];
  } catch {
    return [] as TrackedJob[];
  }
}

function readStoredDocuments(baseProfile: CandidateProfile) {
  if (typeof window === "undefined") {
    return {
      cvText: baseProfile.cvText,
      coverLetterText: baseProfile.coverLetterText,
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      cvText: baseProfile.cvText,
      coverLetterText: baseProfile.coverLetterText,
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      cvText?: string;
      coverLetterText?: string;
    };

    return {
      cvText: parsed.cvText ?? baseProfile.cvText,
      coverLetterText: parsed.coverLetterText ?? baseProfile.coverLetterText,
    };
  } catch {
    return {
      cvText: baseProfile.cvText,
      coverLetterText: baseProfile.coverLetterText,
    };
  }
}

function updateStoredJob(nextJob: TrackedJob) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as { trackedJobs?: TrackedJob[] };
    const trackedJobs = parsed.trackedJobs ?? [];
    const nextJobs = trackedJobs.map((job) => (job.id === nextJob.id ? nextJob : job));

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        trackedJobs: nextJobs,
        activeTrackedJobId: nextJob.id,
      }),
    );
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function JobDetailWorkspace({
  jobId,
  profile,
}: JobDetailWorkspaceProps) {
  const [job, setJob] = useState<TrackedJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState("Carregando detalhe da vaga...");
  const [cvText] = useState(() => readStoredDocuments(profile).cvText);
  const [coverLetterText] = useState(
    () => readStoredDocuments(profile).coverLetterText,
  );
  const activeProfile = useMemo(
    () =>
      deriveCandidateProfile(profile, {
        cvText,
        coverLetterText,
      }),
    [coverLetterText, cvText, profile],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadJob() {
      try {
        const response = await fetch("/api/radar/jobs", {
          cache: "no-store",
        });
        const payload = (await response.json()) as RadarPayload;

        if (!isMounted) {
          return;
        }

        const persistedJob = payload.jobs.find((item) => item.id === jobId);
        if (response.ok && payload.available && persistedJob) {
          setJob(persistedJob);
          setSyncMessage("Detalhe conectado ao radar persistido");
          setIsLoading(false);
          return;
        }

        const storedJob = readStoredJobs().find((item) => item.id === jobId);
        if (storedJob) {
          setJob(storedJob);
          setSyncMessage(
            payload.available
              ? "Detalhe carregado do estado local"
              : payload.reason ?? "Detalhe carregado do estado local",
          );
          setIsLoading(false);
          return;
        }

        setSyncMessage("Vaga nao encontrada no radar atual");
        setIsLoading(false);
      } catch {
        const storedJob = readStoredJobs().find((item) => item.id === jobId);
        if (!isMounted) {
          return;
        }

        if (storedJob) {
          setJob(storedJob);
          setSyncMessage("Detalhe carregado do estado local");
        } else {
          setSyncMessage("Falha ao carregar a vaga");
        }
        setIsLoading(false);
      }
    }

    void loadJob();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const analysis = useMemo<MatchAnalysis | null>(() => {
    if (!job) {
      return null;
    }

    return analyzeJobMatch(job, activeProfile);
  }, [activeProfile, job]);

  const recruiterMessage = useMemo(() => {
    if (!job || !analysis) {
      return "";
    }

    return buildRecruiterMessage(job, activeProfile, analysis);
  }, [activeProfile, analysis, job]);

  async function handleStatusChange(nextStatus: string) {
    if (!job) {
      return;
    }

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

    if (!job.createdAt) {
      setSyncMessage("Status atualizado localmente");
      return;
    }

    try {
      const response = await fetch(`/api/radar/jobs/${job.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        setSyncMessage("Falha ao sincronizar status, mantendo alteracao local");
        return;
      }

      const payload = (await response.json()) as { job: TrackedJob };
      setJob(payload.job);
      updateStoredJob(payload.job);
      setSyncMessage("Status sincronizado com o radar");
    } catch {
      setSyncMessage("Falha ao sincronizar status, mantendo alteracao local");
    }
  }

  async function handleCopyMessage() {
    if (!recruiterMessage) {
      return;
    }

    await navigator.clipboard.writeText(recruiterMessage);
    setSyncMessage("Mensagem copiada para uso com recruiter");
  }

  if (isLoading) {
    return (
      <div className="rounded-[32px] border border-white/60 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
          Job Detail
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-500">{syncMessage}</p>
      </div>
    );
  }

  if (!job || !analysis) {
    return (
      <div className="space-y-6 rounded-[32px] border border-white/60 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
            Job Detail
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            Vaga nao encontrada
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Essa vaga nao apareceu no radar persistido nem no estado local atual.
            Volte ao explorer para selecionar uma vaga ativa novamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Voltar para jobs
          </Link>
          <Link
            href="/control-center"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Abrir control center
          </Link>
        </div>
      </div>
    );
  }

  const matchMeterWidth = `${Math.max(10, Math.min(analysis.score, 100))}%`;

  return (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-slate-900/80 bg-slate-950 p-7 text-white shadow-[0_28px_90px_rgba(15,23,42,0.16)] sm:p-8">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
              Vaga em foco
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              {job.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {job.company} · {job.location} · {job.seniority}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeTone(
                analysis.score,
              )}`}
            >
              {analysis.score}% match
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${statusTone(
                job.status,
              )}`}
            >
              {job.status}
            </span>
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-slate-200">
              {job.intakeMode}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Leitura de match
            </p>
            <p className="mt-3 text-5xl font-semibold">{analysis.score}%</p>
            <p className="mt-2 text-sm text-slate-300">{analysis.verdict}</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-sky-400"
                style={{ width: matchMeterWidth }}
              />
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Modelo de trabalho
            </p>
            <p className="mt-3 text-base font-semibold">{job.workModel}</p>
            <p className="mt-2 text-sm text-slate-300">{job.employmentType}</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Sincronizacao
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">{syncMessage}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Voltar para jobs
          </Link>
          <Link
            href={`/control-center?job=${encodeURIComponent(job.id)}`}
            className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Abrir no control center
          </Link>
          {job.sourceUrl ? (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver vaga original
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleCopyMessage}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Copiar mensagem
          </button>
          <select
            value={job.status}
            onChange={(event) => void handleStatusChange(event.target.value)}
            className="rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/60 bg-white/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
              Resumo e skills
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600">{job.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {job.skills.length > 0 ? (
                job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">
                  Nenhuma skill estruturada detectada nesta vaga.
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-white/60 bg-white/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                O que favorece
              </p>
              <div className="mt-4 grid gap-3">
                {analysis.strengths.map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900 ring-1 ring-emerald-100"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/60 bg-white/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                Pontos de atencao
              </p>
              <div className="mt-4 grid gap-3">
                {analysis.risks.map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900 ring-1 ring-amber-100"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/60 bg-white/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
              Mensagem para recruiter
            </p>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
              {recruiterMessage}
            </p>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-white/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
              Historico da vaga
            </p>
            <div className="mt-4 grid gap-3">
              {job.history.map((entry, index) => (
                <div
                  key={`${entry.status}-${entry.changedAt}-${index}`}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ring-1 ${statusTone(
                        entry.status,
                      )}`}
                    >
                      {entry.status}
                    </span>
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      {new Date(entry.changedAt).toLocaleString("de-DE")}
                    </span>
                  </div>
                  {entry.note ? (
                    <p className="mt-2 text-sm text-slate-500">{entry.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
