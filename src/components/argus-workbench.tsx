"use client";

import { useState, useTransition } from "react";
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
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<"idle" | "copied">("idle");
  const [radarFilter, setRadarFilter] = useState<RadarFilter>("all");
  const [isPending, startTransition] = useTransition();

  const totalOpportunities = trackedJobs.length;
  const priorityJobs = trackedJobs.filter((job) => job.score >= 70).length;
  const crawlerJobs = trackedJobs.filter((job) =>
    job.intakeMode.toLowerCase().includes("crawler"),
  ).length;
  const averageScore =
    trackedJobs.reduce((sum, job) => sum + job.score, 0) / totalOpportunities;
  const filteredTrackedJobs = trackedJobs.filter((job) => {
    if (radarFilter === "crawler") {
      return job.intakeMode.toLowerCase().includes("crawler");
    }

    if (radarFilter === "manual") {
      return job.intakeMode.toLowerCase().includes("manual");
    }

    if (radarFilter === "priority") {
      return job.score >= 70;
    }

    return true;
  });

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

      applyAnalysisState(nextParsedJob, nextAnalysis);
      setTrackedJobs((currentJobs) => [
        toTrackedJob(nextParsedJob, nextAnalysis, {
          intakeMode: "Input manual",
        }),
        ...currentJobs.slice(0, 5),
      ]);
      setActiveDiscoveryId(null);
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
      }
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
    setJobDescription(job.listing.descriptionText);
    applyAnalysisState(job.parsedJob, job.analysis);
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

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
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
            <p className="text-sm font-medium text-slate-500">Média atual</p>
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
                Discovery manual
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Primeiro conector real: Siemens Germany
              </h2>
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

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-7 text-slate-600">
              Faz discovery na busca publica da Siemens filtrada para Alemanha,
              abre o detalhe real do JD, normaliza os dados e injeta tudo no
              radar local para triagem imediata.
            </p>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 ring-1 ring-slate-200">
              Search + detail enrichment
            </span>
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Como testar o fluxo agora
                </p>
                <p className="mt-1 text-sm leading-7 text-slate-500">
                  Clique em buscar, escolha uma vaga descoberta e o painel de
                  análise central passa a refletir a vaga real do portal.
                </p>
              </div>
              <div className="text-sm text-slate-500">
                Media atual do radar: {Math.round(averageScore)}%
              </div>
            </div>
          </div>

          {discoveryError ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {discoveryError}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            {discoveredJobs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-6 text-sm leading-7 text-slate-500">
                Ainda sem resultado carregado. Quando você disparar a coleta,
                o Argus consulta a busca da Siemens, abre o detalhe da vaga,
                calcula o match e injeta o resultado no dashboard.
              </div>
            ) : (
              discoveredJobs.map((job) => (
                <article
                  key={job.listing.externalId}
                  className={`rounded-[24px] border p-5 transition ${
                    activeDiscoveryId === job.listing.externalId
                      ? "border-sky-300 bg-sky-50/80 shadow-[0_18px_40px_rgba(14,165,233,0.12)]"
                      : "border-slate-200 bg-slate-50/80"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {job.listing.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {job.listing.company} · {job.listing.location} ·{" "}
                        {job.listing.family}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeTone(
                        job.analysis.score,
                      )}`}
                    >
                      {job.analysis.score}% {job.analysis.verdict}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                      Job ID {job.listing.externalId}
                    </span>
                    {job.listing.detailEnriched ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
                        JD enriquecido
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-200">
                        Card-only
                      </span>
                    )}
                    {job.listing.workMode ? (
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        {job.listing.workMode}
                      </span>
                    ) : null}
                    {job.listing.experienceLevel ? (
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        {job.listing.experienceLevel}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleInspectDiscovery(job)}
                      className="rounded-full bg-slate-950 px-3 py-1 font-medium text-white transition hover:bg-slate-800"
                    >
                      Analisar aqui
                    </button>
                    <a
                      className="font-medium text-sky-700 hover:text-sky-900"
                      href={job.listing.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir vaga
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                Intake manual
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Cole qualquer job description e transforme em vaga acionável
              </h2>
            </div>
            <button
              type="button"
              onClick={handleProcessDescription}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isPending}
            >
              {isPending ? "Processando..." : "Estruturar e pontuar"}
            </button>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <label className="block">
              <span className="mb-3 block text-sm font-medium text-slate-600">
                Texto bruto do JD
              </span>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                className="min-h-[420px] w-full rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder="Cole aqui a vaga inteira, mesmo desorganizada."
              />
            </label>

            <div className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                      Vaga estruturada
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                      {parsedJob.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {parsedJob.company} · {parsedJob.location}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Fonte ativa:{" "}
                      {activeDiscoveryId
                        ? `Siemens Job ID ${activeDiscoveryId}`
                        : "Input manual"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeTone(
                      analysis.score,
                    )}`}
                  >
                    {analysis.score}% match
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Senioridade
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {parsedJob.seniority}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Modelo
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {parsedJob.workModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Idiomas
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {parsedJob.languages.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Tipo de contrato
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {parsedJob.employmentType}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Skills detectadas
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parsedJob.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">
                  Match vs. perfil
                </p>
                <p className="mt-3 text-2xl font-semibold">{analysis.verdict}</p>
                <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                  <div>
                    <p className="font-medium text-white">Por que essa vaga sobe</p>
                    <ul className="mt-2 space-y-1">
                      {analysis.strengths.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-white">Riscos e gaps</p>
                    <ul className="mt-2 space-y-1">
                      {analysis.risks.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    Mensagem sugerida ao recruiter
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyRecruiterMessage}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    {copiedState === "copied" ? "Copiada" : "Copiar mensagem"}
                  </button>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
                  {recruiterMessage}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
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
            <table className="min-w-full divide-y divide-slate-200 text-left">
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
                  <tr key={job.id}>
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
                      {job.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Perfil inicial
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {profile.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {profile.location} · {profile.availability}
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {profile.summary}
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Stack principal
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.coreStack.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Foco de vagas
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                {profile.targetRoles.map((role) => (
                  <li key={role}>• {role}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Diferenciais
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                {profile.strengthSignals.map((signal) => (
                  <li key={signal}>• {signal}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                Fontes monitoradas
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Portais prioritários
              </h2>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">
              Fase 1
            </span>
          </div>

          <div className="mt-5 space-y-4">
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
                <a
                  className="mt-3 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.url}
                </a>
              </article>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
