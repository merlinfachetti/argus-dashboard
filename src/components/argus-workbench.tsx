"use client";

import { useEffect, useState, useTransition } from "react";
import type { DiscoveredJobListing } from "@/lib/connectors/types";
import {
  analyzeJobMatch,
  buildRecruiterMessage,
  parseJobDescription,
  type MatchAnalysis,
  type ParsedJob,
} from "@/lib/job-intake";
import type { CandidateProfile, PortalSource } from "@/lib/profile";

type ArgusWorkbenchProps = {
  profile: CandidateProfile;
  sources: PortalSource[];
  initialJobDescription: string;
};

type TrackedJob = ParsedJob & {
  id: string;
  score: number;
  verdict: MatchAnalysis["verdict"];
  status: string;
  intakeMode: string;
  sourceUrl?: string;
  externalId?: string;
  family?: string;
};

type DiscoveryPreview = {
  listing: DiscoveredJobListing;
  parsedJob: ParsedJob;
  analysis: MatchAnalysis;
};

type RadarFilter = "all" | "crawler" | "manual" | "priority";
type WorkspaceMode = "discovery" | "manual";
type ActivePanel = "summary" | "match" | "message" | "history";

const STORAGE_KEY = "argus-workbench-state";

function toTrackedJob(
  job: ParsedJob,
  analysis: MatchAnalysis,
  metadata: {
    intakeMode: string;
    sourceUrl?: string;
    externalId?: string;
    family?: string;
  },
): TrackedJob {
  return {
    ...job,
    id:
      metadata.externalId ??
      metadata.sourceUrl ??
      `${job.company}-${job.title}-${Date.now()}`,
    score: analysis.score,
    verdict: analysis.verdict,
    status: analysis.score >= 70 ? "Pronta para revisar" : "Requer triagem",
    intakeMode: metadata.intakeMode,
    sourceUrl: metadata.sourceUrl,
    externalId: metadata.externalId,
    family: metadata.family,
  };
}

function buildInitialState(profile: CandidateProfile, initialJobDescription: string) {
  const parsedJob = parseJobDescription(initialJobDescription);
  const analysis = analyzeJobMatch(parsedJob, profile);
  const recruiterMessage = buildRecruiterMessage(parsedJob, profile, analysis);
  const trackedJob = toTrackedJob(parsedJob, analysis, {
    intakeMode: "Input manual",
  });

  return {
    parsedJob,
    analysis,
    recruiterMessage,
    trackedJobs: [trackedJob],
  };
}

function badgeTone(score: number) {
  if (score >= 78) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (score >= 60) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function modeButtonClass(active: boolean) {
  return active
    ? "bg-slate-950 text-white"
    : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100";
}

function statusTone(status: string) {
  if (status === "Aplicada" || status === "Entrevista") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "Aplicar" || status === "Pronta para revisar") {
    return "bg-sky-50 text-sky-700 ring-sky-200";
  }

  return "bg-slate-50 text-slate-600 ring-slate-200";
}

export function ArgusWorkbench({
  profile,
  sources,
  initialJobDescription,
}: ArgusWorkbenchProps) {
  const initialState = buildInitialState(profile, initialJobDescription);

  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [parsedJob, setParsedJob] = useState(initialState.parsedJob);
  const [analysis, setAnalysis] = useState(initialState.analysis);
  const [recruiterMessage, setRecruiterMessage] = useState(
    initialState.recruiterMessage,
  );
  const [trackedJobs, setTrackedJobs] = useState(initialState.trackedJobs);
  const [discoveredJobs, setDiscoveredJobs] = useState<DiscoveryPreview[]>([]);
  const [activeDiscoveryId, setActiveDiscoveryId] = useState<string | null>(null);
  const [activeTrackedJobId, setActiveTrackedJobId] = useState<string | null>(
    initialState.trackedJobs[0]?.id ?? null,
  );
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<"idle" | "copied">("idle");
  const [radarFilter, setRadarFilter] = useState<RadarFilter>("all");
  const [radarQuery, setRadarQuery] = useState("");
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("discovery");
  const [activePanel, setActivePanel] = useState<ActivePanel>("summary");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const rawState = window.localStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      return;
    }

    try {
      const parsedState = JSON.parse(rawState) as {
        jobDescription?: string;
        parsedJob?: ParsedJob;
        analysis?: MatchAnalysis;
        recruiterMessage?: string;
        trackedJobs?: TrackedJob[];
        discoveredJobs?: DiscoveryPreview[];
        activeDiscoveryId?: string | null;
        activeTrackedJobId?: string | null;
        radarFilter?: RadarFilter;
        radarQuery?: string;
        discoveryQuery?: string;
        workspaceMode?: WorkspaceMode;
        activePanel?: ActivePanel;
      };

      if (parsedState.jobDescription) setJobDescription(parsedState.jobDescription);
      if (parsedState.parsedJob) setParsedJob(parsedState.parsedJob);
      if (parsedState.analysis) setAnalysis(parsedState.analysis);
      if (parsedState.recruiterMessage) {
        setRecruiterMessage(parsedState.recruiterMessage);
      }
      if (parsedState.trackedJobs?.length) setTrackedJobs(parsedState.trackedJobs);
      if (parsedState.discoveredJobs) setDiscoveredJobs(parsedState.discoveredJobs);
      if (parsedState.activeDiscoveryId !== undefined) {
        setActiveDiscoveryId(parsedState.activeDiscoveryId);
      }
      if (parsedState.activeTrackedJobId !== undefined) {
        setActiveTrackedJobId(parsedState.activeTrackedJobId);
      }
      if (parsedState.radarFilter) setRadarFilter(parsedState.radarFilter);
      if (parsedState.radarQuery) setRadarQuery(parsedState.radarQuery);
      if (parsedState.discoveryQuery) setDiscoveryQuery(parsedState.discoveryQuery);
      if (parsedState.workspaceMode) setWorkspaceMode(parsedState.workspaceMode);
      if (parsedState.activePanel) setActivePanel(parsedState.activePanel);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        jobDescription,
        parsedJob,
        analysis,
        recruiterMessage,
        trackedJobs,
        discoveredJobs,
        activeDiscoveryId,
        activeTrackedJobId,
        radarFilter,
        radarQuery,
        discoveryQuery,
        workspaceMode,
        activePanel,
      }),
    );
  }, [
    jobDescription,
    parsedJob,
    analysis,
    recruiterMessage,
    trackedJobs,
    discoveredJobs,
    activeDiscoveryId,
    activeTrackedJobId,
    radarFilter,
    radarQuery,
    discoveryQuery,
    workspaceMode,
    activePanel,
  ]);

  const totalOpportunities = trackedJobs.length;
  const priorityJobs = trackedJobs.filter((job) => job.score >= 70).length;
  const crawlerJobs = trackedJobs.filter((job) =>
    job.intakeMode.toLowerCase().includes("crawler"),
  ).length;
  const filteredTrackedJobs = trackedJobs.filter((job) => {
    const matchesQuery =
      radarQuery.trim().length === 0 ||
      `${job.title} ${job.company} ${job.location} ${job.intakeMode}`
        .toLowerCase()
        .includes(radarQuery.toLowerCase());

    if (radarFilter === "crawler") {
      return job.intakeMode.toLowerCase().includes("crawler") && matchesQuery;
    }

    if (radarFilter === "manual") {
      return job.intakeMode.toLowerCase().includes("manual") && matchesQuery;
    }

    if (radarFilter === "priority") {
      return job.score >= 70 && matchesQuery;
    }

    return matchesQuery;
  });
  const filteredDiscoveredJobs = discoveredJobs.filter((job) =>
    discoveryQuery.trim().length === 0
      ? true
      : `${job.listing.title} ${job.listing.company} ${job.listing.location} ${job.listing.family}`
          .toLowerCase()
          .includes(discoveryQuery.toLowerCase()),
  );
  const activeDiscovery = discoveredJobs.find(
    (job) => job.listing.externalId === activeDiscoveryId,
  );
  const activeTrackedJob =
    trackedJobs.find((job) => job.id === activeTrackedJobId) ??
    (activeDiscoveryId
      ? trackedJobs.find((job) => job.externalId === activeDiscoveryId)
      : undefined) ??
    trackedJobs[0];
  const activeSourceLabel =
    activeTrackedJob?.intakeMode ?? (activeDiscovery ? "Siemens crawler" : "Input manual");

  useEffect(() => {
    if (!activeTrackedJob && trackedJobs[0]) {
      setActiveTrackedJobId(trackedJobs[0].id);
    }
  }, [activeTrackedJob, trackedJobs]);

  function applyAnalysisState(nextParsedJob: ParsedJob, nextAnalysis: MatchAnalysis) {
    setParsedJob(nextParsedJob);
    setAnalysis(nextAnalysis);
    setRecruiterMessage(
      buildRecruiterMessage(nextParsedJob, profile, nextAnalysis),
    );
  }

  function handleProcessDescription() {
    startTransition(() => {
      const nextParsedJob = parseJobDescription(jobDescription);
      const nextAnalysis = analyzeJobMatch(nextParsedJob, profile);
      const nextTrackedJob = toTrackedJob(nextParsedJob, nextAnalysis, {
        intakeMode: "Input manual",
      });

      applyAnalysisState(nextParsedJob, nextAnalysis);
      setTrackedJobs((currentJobs) => [nextTrackedJob, ...currentJobs.slice(0, 5)]);
      setActiveTrackedJobId(nextTrackedJob.id);
      setActiveDiscoveryId(null);
      setWorkspaceMode("manual");
      setActivePanel("summary");
    });
  }

  async function handleRunSiemensDiscovery() {
    setIsDiscovering(true);
    setDiscoveryError(null);

    try {
      const response = await fetch(
        "/api/sources/siemens/discover?limit=6&enrich=1",
        {
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as {
        error?: string;
        jobs: DiscoveredJobListing[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Siemens discovery failed");
      }

      const nextDiscoveries = payload.jobs.map((listing) => {
        const baseParsedJob = parseJobDescription(listing.descriptionText);
        const parsedJob: ParsedJob = {
          ...baseParsedJob,
          title: listing.title,
          company: listing.company,
          location: listing.location,
          summary: listing.descriptionText.replace(/\s+/g, " ").trim().slice(0, 280),
        };
        const analysis = analyzeJobMatch(parsedJob, profile);

        return {
          listing,
          parsedJob,
          analysis,
        };
      });

      setDiscoveredJobs(nextDiscoveries);
      if (nextDiscoveries[0]) {
        setActiveDiscoveryId(nextDiscoveries[0].listing.externalId);
        applyAnalysisState(
          nextDiscoveries[0].parsedJob,
          nextDiscoveries[0].analysis,
        );
        setJobDescription(nextDiscoveries[0].listing.descriptionText);
        setActiveTrackedJobId(nextDiscoveries[0].listing.externalId);
      }
      setWorkspaceMode("discovery");
      setActivePanel("summary");
      setTrackedJobs((currentJobs) => {
        const seenIds = new Set(currentJobs.map((job) => job.id));
        const additions = nextDiscoveries
          .filter((job) => !seenIds.has(job.listing.externalId))
          .map((job) =>
            toTrackedJob(job.parsedJob, job.analysis, {
              intakeMode: "Siemens crawler",
              sourceUrl: job.listing.sourceUrl,
              externalId: job.listing.externalId,
              family: job.listing.family,
            }),
          );

        return [...additions, ...currentJobs].slice(0, 12);
      });
    } catch (error) {
      setDiscoveryError(
        error instanceof Error ? error.message : "Discovery request failed",
      );
    } finally {
      setIsDiscovering(false);
    }
  }

  function handleInspectDiscovery(job: DiscoveryPreview) {
    setActiveDiscoveryId(job.listing.externalId);
    setActiveTrackedJobId(job.listing.externalId);
    setJobDescription(job.listing.descriptionText);
    applyAnalysisState(job.parsedJob, job.analysis);
    setWorkspaceMode("discovery");
    setActivePanel("summary");
  }

  function handleInspectTrackedJob(job: TrackedJob) {
    const nextParsedJob: ParsedJob = {
      title: job.title,
      company: job.company,
      location: job.location,
      seniority: job.seniority,
      workModel: job.workModel,
      employmentType: job.employmentType,
      languages: job.languages,
      skills: job.skills,
      summary: job.summary,
    };

    const nextAnalysis = analyzeJobMatch(nextParsedJob, profile);
    setActiveDiscoveryId(job.externalId ?? null);
    setActiveTrackedJobId(job.id);
    setJobDescription(
      [job.title, `Company: ${job.company}`, `Location: ${job.location}`, job.summary]
        .filter(Boolean)
        .join("\n"),
    );
    applyAnalysisState(nextParsedJob, nextAnalysis);
    setActivePanel("summary");
  }

  function handleUpdateTrackedJobStatus(jobId: string, nextStatus: string) {
    setTrackedJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.id === jobId ? { ...job, status: nextStatus } : job,
      ),
    );
  }

  async function handleCopyRecruiterMessage() {
    try {
      await navigator.clipboard.writeText(recruiterMessage);
      setCopiedState("copied");

      window.setTimeout(() => {
        setCopiedState("idle");
      }, 1800);
    } catch {
      setCopiedState("idle");
    }
  }

  const activeHistory = activeTrackedJob
    ? [
        {
          label: "Origem",
          value: activeTrackedJob.intakeMode,
        },
        {
          label: "Status atual",
          value: activeTrackedJob.status,
        },
        {
          label: "Veredito",
          value: `${activeTrackedJob.verdict} · ${activeTrackedJob.score}%`,
        },
        ...(activeTrackedJob.family
          ? [
              {
                label: "Familia",
                value: activeTrackedJob.family,
              },
            ]
          : []),
        ...(activeTrackedJob.externalId
          ? [
              {
                label: "Job ID",
                value: activeTrackedJob.externalId,
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium text-slate-500">
              Vagas no radar
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {totalOpportunities}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Alimentadas por intake manual e futuras rotinas de crawler.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium text-slate-500">Match forte</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {priorityJobs}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Score acima de 70 para puxar revisão ou aplicação.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium text-slate-500">Discovery real</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {crawlerJobs}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Itens que já vieram de discovery real em portais.
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                Vaga ativa
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {parsedJob.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {parsedJob.company} · {parsedJob.location}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeTone(
                  analysis.score,
                )}`}
              >
                {analysis.score}% match
              </span>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 ring-1 ring-slate-200">
                {activeDiscovery
                  ? `Siemens Job ID ${activeDiscovery.listing.externalId}`
                  : "Input manual"}
              </span>
              {activeTrackedJob ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ring-1 ${statusTone(
                    activeTrackedJob.status,
                  )}`}
                >
                  {activeTrackedJob.status}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Senioridade
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {parsedJob.seniority}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Modelo
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {parsedJob.workModel}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Contrato
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {parsedJob.employmentType}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              Origem ativa: {activeSourceLabel}
            </div>
            {activeTrackedJob ? (
              <select
                value={activeTrackedJob.status}
                onChange={(event) =>
                  handleUpdateTrackedJobStatus(activeTrackedJob.id, event.target.value)
                }
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-300"
              >
                {[
                  "Nova",
                  "Pronta para revisar",
                  "Requer triagem",
                  "Aplicar",
                  "Aplicada",
                  "Entrevista",
                ].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : null}
            {activeDiscovery?.listing.sourceUrl ? (
              <a
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                href={activeDiscovery.listing.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir vaga original
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleCopyRecruiterMessage}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {copiedState === "copied" ? "Mensagem copiada" : "Copiar abordagem"}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-5">
            {[
              { id: "summary", label: "Resumo" },
              { id: "match", label: "Match" },
              { id: "message", label: "Mensagem" },
              { id: "history", label: "Historico" },
            ].map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActivePanel(panel.id as ActivePanel)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activePanel === panel.id
                    ? "bg-slate-950 text-white"
                    : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {panel.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activePanel === "summary" ? (
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    Resumo da vaga
                  </p>
                  <p className="mt-4 text-sm leading-8 text-slate-600">
                    {parsedJob.summary}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                      Fit rapido
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">
                      {analysis.verdict}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      Leitura curta para decidir se vale revisar agora ou deixar no radar.
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                      Skills detectadas
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {parsedJob.skills.length > 0 ? (
                        parsedJob.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          Nenhuma skill estruturada ainda para esta vaga.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activePanel === "match" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    O que favorece
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    {analysis.strengths.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    Pontos de atenção
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    {analysis.risks.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {activePanel === "message" ? (
              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">
                      Mensagem sugerida
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyRecruiterMessage}
                      className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                    >
                      {copiedState === "copied" ? "Copiada" : "Copiar mensagem"}
                    </button>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-200">
                    {recruiterMessage}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-sm font-medium text-slate-700">
                    Como usar esta mensagem
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      1. Revise se o tom combina com a vaga e empresa
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      2. Ajuste detalhes específicos antes de enviar
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      3. Marque o status no radar assim que aplicar
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activePanel === "history" ? (
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    Linha do tempo
                  </p>
                  <div className="mt-4 space-y-3">
                    {activeHistory.map((item) => (
                      <div
                        key={`${item.label}-${item.value}`}
                        className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-sm font-medium text-slate-700">
                    Como testar o fluxo agora
                  </p>
                  <p className="mt-1 text-sm leading-7 text-slate-500">
                    Use um único modo por vez. O objetivo aqui é ver o produto
                    funcionando sem poluição e com decisões rápidas.
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      1. Escolha `Fonte real` ou `JD manual`
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      2. Torne uma vaga ativa no painel
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      3. Valide resumo, match e mensagem
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      4. Atualize o status para manter o radar limpo
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div
          id="radar"
          className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                Dashboard
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Pipeline inicial de vagas rastreadas
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Próxima etapa: persistência em banco e atualização automática.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { id: "all", label: "Todas" },
              { id: "crawler", label: "Crawler" },
              { id: "manual", label: "Manuais" },
              { id: "priority", label: "Prioridade" },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setRadarFilter(filter.id as RadarFilter)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  radarFilter === filter.id
                    ? "bg-slate-950 text-white"
                    : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                  value={radarQuery}
                  onChange={(event) => setRadarQuery(event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:max-w-md"
                  placeholder="Buscar no radar por titulo, empresa, local ou origem..."
                />
                <div className="text-sm text-slate-500">
                  {filteredTrackedJobs.length} item(ns) visivel(is)
                </div>
              </div>
            </div>
            {filteredTrackedJobs.length === 0 ? (
              <div className="bg-white px-4 py-10 text-center text-sm text-slate-500">
                Nenhuma vaga encontrada com os filtros atuais.
              </div>
            ) : null}
            <div className="divide-y divide-slate-100 bg-white md:hidden">
              {filteredTrackedJobs.map((job) => (
                <article
                  key={job.id}
                  className={`space-y-4 px-4 py-4 transition ${
                    activeTrackedJobId === job.id
                      ? "bg-sky-50/70"
                      : "bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => handleInspectTrackedJob(job)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {job.company} · {job.location}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeTone(
                        job.score,
                      )}`}
                    >
                      {job.score}%
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                      {job.intakeMode}
                    </span>
                    {job.sourceUrl ? (
                      <a
                        className="rounded-full bg-white px-3 py-1 text-sky-700 ring-1 ring-slate-200"
                        href={job.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Abrir fonte
                      </a>
                    ) : null}
                  </div>
                  <select
                    value={job.status}
                    onChange={(event) =>
                      handleUpdateTrackedJobStatus(job.id, event.target.value)
                    }
                    onClick={(event) => event.stopPropagation()}
                    className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300"
                  >
                    {[
                      "Nova",
                      "Pronta para revisar",
                      "Requer triagem",
                      "Aplicar",
                      "Aplicada",
                      "Entrevista",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
            <table className="hidden min-w-full divide-y divide-slate-200 text-left md:table">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  <th className="px-4 py-3 font-semibold">Vaga</th>
                  <th className="px-4 py-3 font-semibold">Origem</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTrackedJobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`cursor-pointer transition ${
                      activeTrackedJobId === job.id
                        ? "bg-sky-50/70"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => handleInspectTrackedJob(job)}
                  >
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {job.company} · {job.location}
                      </p>
                      {job.sourceUrl ? (
                        <a
                          className="mt-2 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900"
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir fonte
                        </a>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {job.intakeMode}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeTone(
                          job.score,
                        )}`}
                      >
                        {job.score}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <select
                        value={job.status}
                        onChange={(event) =>
                          handleUpdateTrackedJobStatus(job.id, event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300"
                      >
                        {[
                          "Nova",
                          "Pronta para revisar",
                          "Requer triagem",
                          "Aplicar",
                          "Aplicada",
                          "Entrevista",
                        ].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div
          id="profile"
          className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-5">
            <button
              type="button"
              onClick={() => setWorkspaceMode("discovery")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${modeButtonClass(
                workspaceMode === "discovery",
              )}`}
            >
              Fonte real
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode("manual")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${modeButtonClass(
                workspaceMode === "manual",
              )}`}
            >
              JD manual
            </button>
          </div>

          {workspaceMode === "discovery" ? (
            <div className="mt-5 space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    Siemens Germany
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Busca publica + enriquecimento do detalhe real da vaga.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunSiemensDiscovery}
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                  disabled={isDiscovering}
                >
                  {isDiscovering ? "Coletando..." : "Buscar vagas Siemens"}
                </button>
              </div>

              {discoveryError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {discoveryError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                  value={discoveryQuery}
                  onChange={(event) => setDiscoveryQuery(event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  placeholder="Filtrar vagas descobertas..."
                />
                <div className="text-sm text-slate-500">
                  {filteredDiscoveredJobs.length} vaga(s)
                </div>
              </div>

              <div className="space-y-3">
                {discoveredJobs.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-6 text-sm leading-7 text-slate-500">
                    Traga vagas reais para este painel. A ideia aqui e manter o
                    discovery num lugar proprio e sem competir com o restante da
                    tela.
                  </div>
                ) : filteredDiscoveredJobs.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-6 text-sm leading-7 text-slate-500">
                    Nenhuma vaga descoberta bate com o filtro atual.
                  </div>
                ) : (
                  filteredDiscoveredJobs.map((job) => (
                    <article
                      key={job.listing.externalId}
                      className={`rounded-[24px] border p-4 transition ${
                        activeDiscoveryId === job.listing.externalId
                          ? "border-sky-300 bg-sky-50/80 shadow-[0_18px_40px_rgba(14,165,233,0.12)]"
                          : "border-slate-200 bg-slate-50/80"
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-slate-950">
                              {job.listing.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {job.listing.company} · {job.listing.location}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeTone(
                              job.analysis.score,
                            )}`}
                          >
                            {job.analysis.score}%
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                            {job.listing.family}
                          </span>
                          {job.listing.detailEnriched ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
                              JD enriquecido
                            </span>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleInspectDiscovery(job)}
                            className="rounded-full bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                          >
                            Tornar ativa
                          </button>
                          <a
                            className="rounded-full bg-white px-3 py-2 text-sm font-medium text-sky-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                            href={job.listing.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir vaga
                          </a>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    JD manual
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Cole qualquer descricao de vaga sem formatacao. O Argus
                    estrutura, pontua e joga para o radar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleProcessDescription}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={isPending}
                >
                  {isPending ? "Processando..." : "Estruturar"}
                </button>
              </div>

              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                className="min-h-[420px] w-full rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder="Cole aqui a vaga inteira, mesmo desorganizada."
              />
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Perfil e fontes
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {profile.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {profile.location} · {profile.availability}
          </p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Stack principal
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.coreStack.slice(0, 8).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {sources.map((source) => (
              <article
                key={source.company}
                className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {source.company}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {source.strategy}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 ring-1 ring-slate-200">
                    {source.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
