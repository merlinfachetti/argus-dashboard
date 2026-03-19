"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { DiscoveredJobListing } from "@/lib/connectors/types";
import {
  analyzeJobMatch,
  buildRecruiterMessage,
  parseJobDescription,
  type MatchAnalysis,
  type ParsedJob,
} from "@/lib/job-intake";
import type { CandidateProfile, PortalSource } from "@/lib/profile";
import {
  createHistoryEntry,
  DASHBOARD_STATUS_LANES,
  STATUS_OPTIONS,
  type JobHistoryEntry,
  type TrackedJob,
} from "@/lib/radar-types";

type ArgusWorkbenchProps = {
  profile: CandidateProfile;
  sources: PortalSource[];
  initialJobDescription: string;
  pageMode?: "control" | "dashboard" | "jobs";
  initialRadarQuery?: string;
  initialActiveJobId?: string;
};

type DiscoveryPreview = {
  listing: DiscoveredJobListing;
  parsedJob: ParsedJob;
  analysis: MatchAnalysis;
};

type RadarFilter = "all" | "crawler" | "manual" | "priority";
type WorkspaceMode = "discovery" | "manual";
type ActivePanel = "summary" | "match" | "message" | "history";
type JobsSort = "updated" | "score" | "company";

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
  const initialStatus =
    analysis.score >= 70 ? "Pronta para revisar" : "Requer triagem";

  return {
    ...job,
    id:
      metadata.externalId ??
      metadata.sourceUrl ??
      `${job.company}-${job.title}-${Date.now()}`,
    score: analysis.score,
    verdict: analysis.verdict,
    status: initialStatus,
    intakeMode: metadata.intakeMode,
    sourceUrl: metadata.sourceUrl,
    externalId: metadata.externalId,
    family: metadata.family,
    history: [createHistoryEntry(initialStatus)],
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
    ? "bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
    : "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50";
}

function statusTone(status: string) {
  if (status === "Aplicada" || status === "Entrevista") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "Aplicar" || status === "Pronta para revisar") {
    return "bg-sky-50 text-sky-700 ring-sky-200";
  }

  return "bg-slate-100 text-slate-800 ring-slate-300";
}

function laneTone(status: string) {
  if (status === "Entrevista") {
    return "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.92))]";
  }

  if (status === "Aplicada" || status === "Aplicar") {
    return "border-sky-200 bg-[linear-gradient(180deg,rgba(239,246,255,0.95),rgba(255,255,255,0.92))]";
  }

  if (status === "Pronta para revisar") {
    return "border-violet-200 bg-[linear-gradient(180deg,rgba(245,243,255,0.95),rgba(255,255,255,0.92))]";
  }

  return "border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.92))]";
}

export function ArgusWorkbench({
  profile,
  sources,
  initialJobDescription,
  pageMode = "control",
  initialRadarQuery = "",
  initialActiveJobId,
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
  const [radarQuery, setRadarQuery] = useState(initialRadarQuery);
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("discovery");
  const [activePanel, setActivePanel] = useState<ActivePanel>("summary");
  const [jobsSourceFilter, setJobsSourceFilter] = useState("all");
  const [jobsSeniorityFilter, setJobsSeniorityFilter] = useState("all");
  const [jobsMinimumScore, setJobsMinimumScore] = useState("all");
  const [jobsSort, setJobsSort] = useState<JobsSort>("updated");
  const [syncState, setSyncState] = useState<
    "checking" | "connected" | "offline" | "error"
  >("checking");
  const [syncMessage, setSyncMessage] = useState(
    "Conectando radar persistente...",
  );
  const [isPending, startTransition] = useTransition();
  const isControlPage = pageMode === "control";
  const isDashboardPage = pageMode === "dashboard";
  const isJobsPage = pageMode === "jobs";

  const applyAnalysisState = useCallback(
    (nextParsedJob: ParsedJob, nextAnalysis: MatchAnalysis) => {
      setParsedJob(nextParsedJob);
      setAnalysis(nextAnalysis);
      setRecruiterMessage(
        buildRecruiterMessage(nextParsedJob, profile, nextAnalysis),
      );
    },
    [profile],
  );

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
        jobsSourceFilter?: string;
        jobsSeniorityFilter?: string;
        jobsMinimumScore?: string;
        jobsSort?: JobsSort;
        syncState?: "checking" | "connected" | "offline" | "error";
        syncMessage?: string;
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
      if (parsedState.jobsSourceFilter) {
        setJobsSourceFilter(parsedState.jobsSourceFilter);
      }
      if (parsedState.jobsSeniorityFilter) {
        setJobsSeniorityFilter(parsedState.jobsSeniorityFilter);
      }
      if (parsedState.jobsMinimumScore) {
        setJobsMinimumScore(parsedState.jobsMinimumScore);
      }
      if (parsedState.jobsSort) setJobsSort(parsedState.jobsSort);
      if (parsedState.syncState) setSyncState(parsedState.syncState);
      if (parsedState.syncMessage) setSyncMessage(parsedState.syncMessage);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [profile]);

  useEffect(() => {
    if (initialRadarQuery.trim().length > 0) {
      setRadarQuery(initialRadarQuery);
    }
  }, [initialRadarQuery]);

  useEffect(() => {
    if (!initialActiveJobId) {
      return;
    }

    const matchingJob = trackedJobs.find((job) => job.id === initialActiveJobId);
    if (matchingJob) {
      const nextParsedJob: ParsedJob = {
        title: matchingJob.title,
        company: matchingJob.company,
        location: matchingJob.location,
        seniority: matchingJob.seniority,
        workModel: matchingJob.workModel,
        employmentType: matchingJob.employmentType,
        languages: matchingJob.languages,
        skills: matchingJob.skills,
        summary: matchingJob.summary,
      };

      const nextAnalysis = analyzeJobMatch(nextParsedJob, profile);
      setActiveDiscoveryId(matchingJob.externalId ?? null);
      setActiveTrackedJobId(matchingJob.id);
      setJobDescription(
        [
          matchingJob.title,
          `Company: ${matchingJob.company}`,
          `Location: ${matchingJob.location}`,
          matchingJob.summary,
        ]
          .filter(Boolean)
          .join("\n"),
      );
      applyAnalysisState(nextParsedJob, nextAnalysis);
      setActivePanel("summary");
    }
  }, [applyAnalysisState, initialActiveJobId, profile, trackedJobs]);

  useEffect(() => {
    let isMounted = true;

    async function loadPersistedRadar() {
      try {
        const response = await fetch("/api/radar/jobs", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          available: boolean;
          reason?: string | null;
          jobs: TrackedJob[];
        };

        if (!isMounted) {
          return;
        }

        if (!response.ok || !payload.available) {
          setSyncState("offline");
          setSyncMessage(payload.reason ?? "Banco ainda nao configurado");
          return;
        }

        setSyncState("connected");
        setSyncMessage("Radar persistente conectado");

        if (payload.jobs.length > 0) {
          const nextActiveJob = payload.jobs[0];
          const nextParsedJob: ParsedJob = {
            title: nextActiveJob.title,
            company: nextActiveJob.company,
            location: nextActiveJob.location,
            seniority: nextActiveJob.seniority,
            workModel: nextActiveJob.workModel,
            employmentType: nextActiveJob.employmentType,
            languages: nextActiveJob.languages,
            skills: nextActiveJob.skills,
            summary: nextActiveJob.summary,
          };

          setTrackedJobs(payload.jobs);
          setActiveTrackedJobId(nextActiveJob.id);
          setActiveDiscoveryId(nextActiveJob.externalId ?? null);
          setJobDescription(nextActiveJob.summary);
          const nextAnalysis = analyzeJobMatch(nextParsedJob, profile);
          setParsedJob(nextParsedJob);
          setAnalysis(nextAnalysis);
          setRecruiterMessage(
            buildRecruiterMessage(nextParsedJob, profile, nextAnalysis),
          );
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setSyncState("error");
        setSyncMessage("Falha ao carregar estado persistido do radar");
      }
    }

    void loadPersistedRadar();

    return () => {
      isMounted = false;
    };
  }, [profile]);

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
        jobsSourceFilter,
        jobsSeniorityFilter,
        jobsMinimumScore,
        jobsSort,
        syncState,
        syncMessage,
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
    jobsSourceFilter,
    jobsSeniorityFilter,
    jobsMinimumScore,
    jobsSort,
    syncState,
    syncMessage,
  ]);

  const totalOpportunities = trackedJobs.length;
  const priorityJobs = trackedJobs.filter((job) => job.score >= 70).length;
  const crawlerJobs = trackedJobs.filter((job) =>
    job.intakeMode.toLowerCase().includes("crawler"),
  ).length;
  const manualJobs = trackedJobs.filter((job) =>
    job.intakeMode.toLowerCase().includes("manual"),
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
  const jobsFilteredTrackedJobs = [...filteredTrackedJobs]
    .filter((job) =>
      jobsSourceFilter === "all"
        ? true
        : job.intakeMode.toLowerCase().includes(jobsSourceFilter.toLowerCase()),
    )
    .filter((job) =>
      jobsSeniorityFilter === "all"
        ? true
        : job.seniority.toLowerCase() === jobsSeniorityFilter.toLowerCase(),
    )
    .filter((job) =>
      jobsMinimumScore === "all" ? true : job.score >= Number(jobsMinimumScore),
    )
    .sort((left, right) => {
      if (jobsSort === "score") {
        return right.score - left.score;
      }

      if (jobsSort === "company") {
        return left.company.localeCompare(right.company);
      }

      return (
        new Date(right.updatedAt ?? 0).getTime() -
        new Date(left.updatedAt ?? 0).getTime()
      );
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
  const jobsPreviewJob = isJobsPage
    ? jobsFilteredTrackedJobs.find((job) => job.id === activeTrackedJobId) ??
      jobsFilteredTrackedJobs[0] ??
      null
    : null;
  const jobsPreviewAnalysis = jobsPreviewJob
    ? jobsPreviewJob.id === activeTrackedJob?.id
      ? analysis
      : analyzeJobMatch(
          {
            title: jobsPreviewJob.title,
            company: jobsPreviewJob.company,
            location: jobsPreviewJob.location,
            seniority: jobsPreviewJob.seniority,
            workModel: jobsPreviewJob.workModel,
            employmentType: jobsPreviewJob.employmentType,
            languages: jobsPreviewJob.languages,
            skills: jobsPreviewJob.skills,
            summary: jobsPreviewJob.summary,
          },
          profile,
        )
      : null;
  const activeSourceLabel =
    activeTrackedJob?.intakeMode ?? (activeDiscovery ? "Siemens crawler" : "Input manual");
  const matchMeterWidth = `${Math.max(10, Math.min(analysis.score, 100))}%`;
  const jobsPreviewMeterWidth = jobsPreviewAnalysis
    ? `${Math.max(10, Math.min(jobsPreviewAnalysis.score, 100))}%`
    : "0%";

  function mergePersistedJob(nextJob: TrackedJob) {
    setTrackedJobs((currentJobs) => {
      const nextJobs = currentJobs.map((job) => {
        const sameIdentity =
          job.id === nextJob.id ||
          (job.externalId && job.externalId === nextJob.externalId) ||
          (job.sourceUrl && job.sourceUrl === nextJob.sourceUrl);

        return sameIdentity ? nextJob : job;
      });

      const alreadyIncluded = nextJobs.some((job) => job.id === nextJob.id);
      return alreadyIncluded ? nextJobs : [nextJob, ...nextJobs].slice(0, 20);
    });
    setActiveTrackedJobId((currentId) => {
      if (
        currentId === nextJob.id ||
        currentId === nextJob.externalId ||
        currentId === activeTrackedJob?.id
      ) {
        return nextJob.id;
      }

      return currentId;
    });
  }

  async function persistTrackedJob(nextJob: TrackedJob, rawDescription?: string) {
    try {
      const response = await fetch("/api/radar/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job: nextJob,
          rawDescription,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Falha ao persistir vaga");
      }

      const payload = (await response.json()) as { job: TrackedJob };
      mergePersistedJob(payload.job);
      setSyncState("connected");
      setSyncMessage("Radar persistido no banco");
    } catch (error) {
      setSyncState("offline");
      setSyncMessage(
        error instanceof Error
          ? error.message
          : "Banco indisponivel, mantendo estado local",
      );
    }
  }

  async function persistTrackedJobStatus(jobId: string, status: TrackedJob["status"]) {
    try {
      const response = await fetch(`/api/radar/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Falha ao atualizar status");
      }

      const payload = (await response.json()) as { job: TrackedJob };
      mergePersistedJob(payload.job);
      setSyncState("connected");
      setSyncMessage("Status sincronizado com o banco");
    } catch (error) {
      setSyncState("offline");
      setSyncMessage(
        error instanceof Error
          ? error.message
          : "Falha ao sincronizar status, mantendo alteracao local",
      );
    }
  }

  useEffect(() => {
    if (!activeTrackedJob && trackedJobs[0]) {
      setActiveTrackedJobId(trackedJobs[0].id);
    }
  }, [activeTrackedJob, trackedJobs]);

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
      void persistTrackedJob(nextTrackedJob, jobDescription);
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
      const jobsToPersist: TrackedJob[] = [];
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

        jobsToPersist.push(...additions);
        return [...additions, ...currentJobs].slice(0, 12);
      });
      jobsToPersist.forEach((job) => {
        const matchingDiscovery = nextDiscoveries.find(
          (discovery) => discovery.listing.externalId === job.externalId,
        );
        void persistTrackedJob(job, matchingDiscovery?.listing.descriptionText);
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
      currentJobs.map((job) => {
        if (job.id !== jobId) {
          return job;
        }

        const status = nextStatus as TrackedJob["status"];
        const nextHistory: JobHistoryEntry[] =
          job.status === status
            ? job.history
            : [createHistoryEntry(status), ...job.history].slice(0, 12);

        const nextJob = {
          ...job,
          status,
          updatedAt: new Date().toISOString(),
          history: nextHistory,
        };

        if (job.createdAt) {
          void persistTrackedJobStatus(jobId, status);
        } else {
          void persistTrackedJob(nextJob, job.summary);
        }
        return nextJob;
      }),
    );
  }

  function handleAdvanceTrackedJob(jobId: string) {
    const currentJob = trackedJobs.find((job) => job.id === jobId);

    if (!currentJob) {
      return;
    }

    const currentIndex = STATUS_OPTIONS.indexOf(
      currentJob.status as (typeof STATUS_OPTIONS)[number],
    );

    if (currentIndex === -1 || currentIndex === STATUS_OPTIONS.length - 1) {
      return;
    }

    handleUpdateTrackedJobStatus(jobId, STATUS_OPTIONS[currentIndex + 1]);
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

  const activeSnapshot = activeTrackedJob
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
  const activeTimeline =
    activeTrackedJob?.history.length && activeTrackedJob.history.length > 0
      ? activeTrackedJob.history
      : activeTrackedJob
        ? [createHistoryEntry(activeTrackedJob.status)]
        : [];
  const comparisonJobs = [...filteredTrackedJobs]
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
  const dashboardLanes = DASHBOARD_STATUS_LANES.map((status) => ({
    status,
    count: trackedJobs.filter((job) => job.status === status).length,
    jobs: trackedJobs.filter((job) => job.status === status).slice(0, 3),
  }));
  const jobsSourceOptions = [
    "all",
    ...new Set(
      trackedJobs.map((job) =>
        job.intakeMode.toLowerCase().includes("crawler") ? "crawler" : "manual",
      ),
    ),
  ];
  const jobsSeniorityOptions = [
    "all",
    ...new Set(trackedJobs.map((job) => job.seniority).filter(Boolean)),
  ];

  return (
    <div
      className={
        isControlPage
          ? "grid gap-8 xl:grid-cols-[1.12fr_0.88fr]"
          : "space-y-8"
      }
    >
      <section className="space-y-8">
        {!isJobsPage ? (
          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr_0.75fr]">
          <div className="rounded-[36px] border border-slate-900/80 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.98)_55%,rgba(14,165,233,0.78))] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
              Match em foco
            </p>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-5xl font-semibold">{analysis.score}%</p>
                <p className="mt-2 text-sm text-slate-300">{analysis.verdict}</p>
                <p className="mt-4 max-w-sm text-sm leading-7 text-slate-200">
                  Um snapshot rapido da vaga ativa para decidir se ela merece aprofundamento imediato.
                </p>
              </div>
              <div className="min-w-[14rem] flex-1">
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-sky-400"
                    style={{ width: matchMeterWidth }}
                  />
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Score da vaga ativa contra o seu perfil principal.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Pipeline forte</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">
              {priorityJobs}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Vagas com score alto para puxar acao imediata.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,237,0.92))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Cobertura real</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">
              {crawlerJobs}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Itens vindos de discovery real contra {manualJobs} manuais.
            </p>
          </div>
          </div>
        ) : null}

        <div
          className={`rounded-[30px] border px-5 py-4 text-sm shadow-[0_18px_50px_rgba(15,23,42,0.04)] ${
            syncState === "connected"
              ? "border-emerald-200 bg-[linear-gradient(90deg,rgba(236,253,245,0.96),rgba(255,255,255,0.94))] text-emerald-800"
              : syncState === "checking"
                ? "border-sky-200 bg-[linear-gradient(90deg,rgba(239,246,255,0.96),rgba(255,255,255,0.94))] text-sky-800"
                : "border-amber-200 bg-[linear-gradient(90deg,rgba(255,251,235,0.96),rgba(255,255,255,0.94))] text-amber-800"
          }`}
        >
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-current align-middle opacity-80" />
          <span className="font-semibold">Persistencia do radar:</span> {syncMessage}
        </div>

        {!isDashboardPage ? (
          <div className="rounded-[40px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,243,0.9))] p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
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
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-800 ring-1 ring-slate-300">
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

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
            <div className="rounded-[30px] border border-slate-900/80 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.96)_55%,rgba(14,165,233,0.7))] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                Leitura de match
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold">{analysis.score}%</p>
                  <p className="mt-2 text-sm text-slate-300">{analysis.verdict}</p>
                </div>
                <div className="w-full max-w-[14rem]">
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: matchMeterWidth }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
                    <span>baixo</span>
                    <span>alto</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[30px] border border-slate-200 bg-white/88 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Senioridade
              </p>
              <p className="mt-3 text-base font-semibold text-slate-900">
                {parsedJob.seniority}
              </p>
              <p className="mt-3 text-sm text-slate-500">{parsedJob.workModel}</p>
            </div>
            <div className="rounded-[30px] border border-slate-200 bg-white/88 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Contrato
              </p>
              <p className="mt-3 text-base font-semibold text-slate-900">
                {parsedJob.employmentType}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {parsedJob.languages.join(" · ") || "Idiomas nao detectados"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              Origem ativa: {activeSourceLabel}
            </div>
            {activeTrackedJob ? (
              <select
                value={activeTrackedJob.status}
                onChange={(event) =>
                  handleUpdateTrackedJobStatus(activeTrackedJob.id, event.target.value)
                }
                className="rounded-full border border-slate-300 bg-white/95 px-4 py-2 text-sm font-medium text-slate-800 outline-none shadow-[0_10px_24px_rgba(15,23,42,0.04)] focus:border-sky-300"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : null}
            {activeDiscovery?.listing.sourceUrl ? (
              <a
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-semibold text-sky-800 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
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
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-4 py-2 text-sm font-medium text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:brightness-105"
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
                    ? "bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                    : "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50"
                }`}
              >
                {panel.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activePanel === "summary" ? (
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    Resumo da vaga
                  </p>
                  <p className="mt-4 text-sm leading-8 text-slate-600">
                    {parsedJob.summary}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
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
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
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
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.05fr_1.05fr]">
                <div className="rounded-[28px] border border-slate-900/80 bg-slate-950 p-6 text-white">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">
                    Match score
                  </p>
                  <p className="mt-4 text-5xl font-semibold">{analysis.score}%</p>
                  <p className="mt-3 text-sm text-slate-300">{analysis.verdict}</p>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: matchMeterWidth }}
                    />
                  </div>
                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                      {analysis.strengths.length} sinais positivos
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                      {analysis.risks.length} riscos ou gaps
                    </div>
                  </div>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    O que favorece
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    {analysis.strengths.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
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
              <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white">
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
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
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
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                    Linha do tempo
                  </p>
                  <div className="mt-4 grid gap-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {activeSnapshot.map((item) => (
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

                    <div className="space-y-3">
                      {activeTimeline.map((entry, index) => (
                        <div
                          key={`${entry.status}-${entry.changedAt}-${index}`}
                          className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200"
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
                            <p className="mt-2 text-sm text-slate-600">{entry.note}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-6">
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
        ) : null}
        {isDashboardPage || isJobsPage ? (
          <div
          id="radar"
          className="rounded-[40px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,248,255,0.88))] p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                {isJobsPage ? "Jobs" : "Dashboard"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                {isJobsPage
                  ? "Vagas rastreadas com foco em busca e selecao"
                  : "Pipeline visual de vagas rastreadas"}
              </h2>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {isJobsPage
                ? "Use a busca do header para filtrar o radar por qualquer termo."
                : "Próxima etapa: persistência em banco e atualização automática."}
            </div>
          </div>

          {!isJobsPage ? (
            <div className="mt-6 rounded-[32px] border border-slate-900/80 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.98)_50%,rgba(14,165,233,0.62))] p-6 text-white">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">
                  Estado do radar
                </p>
                <p className="mt-3 text-4xl font-semibold">{totalOpportunities}</p>
                <p className="mt-2 text-sm text-slate-300">
                  oportunidades visiveis e prontas para triagem.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Priority
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{priorityJobs}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Crawler
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{crawlerJobs}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Manual
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{manualJobs}</p>
                </div>
              </div>
            </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { id: "all", label: `Todas (${totalOpportunities})` },
              { id: "crawler", label: `Crawler (${crawlerJobs})` },
              { id: "manual", label: `Manuais (${manualJobs})` },
              { id: "priority", label: `Prioridade (${priorityJobs})` },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setRadarFilter(filter.id as RadarFilter)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  radarFilter === filter.id
                    ? "bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                    : "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {isJobsPage ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[32px] border border-slate-900/80 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.98)_55%,rgba(14,165,233,0.75))] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">
                  Jobs Explorer
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {jobsFilteredTrackedJobs.length}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  vagas apos busca do header, filtros locais e ordenacao.
                </p>
              </div>
              <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Origem
                    </span>
                    <select
                      value={jobsSourceFilter}
                      onChange={(event) => setJobsSourceFilter(event.target.value)}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-sky-300"
                    >
                      {jobsSourceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "all"
                            ? "Todas"
                            : option === "crawler"
                              ? "Crawler"
                              : "Manual"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Senioridade
                    </span>
                    <select
                      value={jobsSeniorityFilter}
                      onChange={(event) => setJobsSeniorityFilter(event.target.value)}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-sky-300"
                    >
                      {jobsSeniorityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "all" ? "Todas" : option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Score minimo
                    </span>
                    <select
                      value={jobsMinimumScore}
                      onChange={(event) => setJobsMinimumScore(event.target.value)}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-sky-300"
                    >
                      <option value="all">Todos</option>
                      <option value="60">60+</option>
                      <option value="70">70+</option>
                      <option value="80">80+</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Ordenar por
                    </span>
                    <select
                      value={jobsSort}
                      onChange={(event) => setJobsSort(event.target.value as JobsSort)}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-sky-300"
                    >
                      <option value="updated">Atualizacao</option>
                      <option value="score">Score</option>
                      <option value="company">Empresa</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {isJobsPage ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[32px] border border-slate-900/80 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.98)_55%,rgba(14,165,233,0.72))] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">
                      Vaga em foco
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">
                      {jobsPreviewJob?.title ?? "Selecione uma vaga"}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {jobsPreviewJob
                        ? `${jobsPreviewJob.company} · ${jobsPreviewJob.location}`
                        : "Use a busca do header ou os filtros abaixo para abrir uma vaga do radar."}
                    </p>
                  </div>
                  {jobsPreviewJob && jobsPreviewAnalysis ? (
                    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        Match atual
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        {jobsPreviewAnalysis.score}%
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {jobsPreviewAnalysis.verdict}
                      </p>
                    </div>
                  ) : null}
                </div>

                {jobsPreviewJob && jobsPreviewAnalysis ? (
                  <>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-sky-400"
                        style={{ width: jobsPreviewMeterWidth }}
                      />
                    </div>
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Sinais fortes
                        </p>
                        <div className="mt-3 grid gap-2">
                          {jobsPreviewAnalysis.strengths.slice(0, 3).map((item) => (
                            <div
                              key={item}
                              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Pontos de atencao
                        </p>
                        <div className="mt-3 grid gap-2">
                          {jobsPreviewAnalysis.risks.slice(0, 3).map((item) => (
                            <div
                              key={item}
                              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectTrackedJob(jobsPreviewJob)}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                      >
                        Inspecionar no explorer
                      </button>
                      <Link
                        href={`/control-center?job=${encodeURIComponent(jobsPreviewJob.id)}`}
                        className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                      >
                        Abrir no control center
                      </Link>
                      {jobsPreviewJob.sourceUrl ? (
                        <a
                          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                          href={jobsPreviewJob.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver vaga original
                        </a>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                  Leitura rapida do radar
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[24px] bg-white px-4 py-4 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Resultado visivel
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">
                      {jobsFilteredTrackedJobs.length}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      vagas combinando com a busca principal e filtros locais.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] bg-white px-4 py-4 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        Maior match
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {jobsFilteredTrackedJobs[0]?.score ?? 0}%
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-white px-4 py-4 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        Prontas p/ revisar
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {
                          jobsFilteredTrackedJobs.filter((job) => job.score >= 70)
                            .length
                        }
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[24px] bg-white px-4 py-4 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Vaga selecionada
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {jobsPreviewJob?.title ?? "Nenhuma vaga selecionada"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      {jobsPreviewJob
                        ? `${jobsPreviewJob.seniority} · ${jobsPreviewJob.intakeMode} · ${jobsPreviewJob.status}`
                        : "Selecione uma vaga do radar para abrir a leitura detalhada."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {isDashboardPage ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-5">
            {dashboardLanes.map((lane) => (
              <section
                key={lane.status}
                className={`rounded-[30px] border p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] ${laneTone(
                  lane.status,
                )}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {lane.status}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {lane.count}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    Lane
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {lane.jobs.length > 0 ? (
                    lane.jobs.map((job) => (
                      <article
                        key={`${lane.status}-${job.id}`}
                        className="rounded-[24px] bg-white/92 p-4 ring-1 ring-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.04)]"
                      >
                        <button
                          type="button"
                          onClick={() => handleInspectTrackedJob(job)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {job.title}
                          </p>
                          <p className="mt-1 text-xs leading-6 text-slate-500">
                            {job.company} · {job.location}
                          </p>
                        </button>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeTone(
                              job.score,
                            )}`}
                          >
                            {job.score}%
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleInspectTrackedJob(job)}
                              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-50"
                            >
                              Abrir
                            </button>
                            {job.status !== "Entrevista" ? (
                              <button
                                type="button"
                                onClick={() => handleAdvanceTrackedJob(job.id)}
                                className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-800"
                              >
                                Avancar
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/75 px-4 py-5 text-sm text-slate-500">
                      Nenhuma vaga nesta etapa.
                    </div>
                  )}
                </div>
              </section>
            ))}
            </div>
          ) : null}

          {isDashboardPage ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="rounded-[32px] border border-slate-900/80 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.98)_55%,rgba(14,165,233,0.72))] p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">
                Comparativo rapido
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Leitura horizontal das melhores vagas do radar para decidir qual
                merece virar foco agora.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {comparisonJobs.length > 0 ? (
                comparisonJobs.map((job) => (
                  <article
                    key={`compare-${job.id}`}
                    className={`rounded-[30px] border p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition ${
                      activeTrackedJobId === job.id
                        ? "border-sky-300 bg-sky-50/80 shadow-[0_18px_40px_rgba(14,165,233,0.12)]"
                        : "border-slate-200 bg-white/88"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleInspectTrackedJob(job)}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {job.title}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-slate-500">
                        {job.company} · {job.location}
                      </p>
                    </button>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${Math.max(8, Math.min(job.score, 100))}%` }}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeTone(
                          job.score,
                        )}`}
                      >
                        {job.score}% match
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone(
                          job.status,
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-6 text-sm text-slate-500 md:col-span-3">
                  Adicione ou descubra mais vagas para montar o comparativo.
                </div>
              )}
            </div>
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {isJobsPage ? (
                  <div className="text-sm leading-7 text-slate-600">
                    A busca principal fica no header e atualiza esta pagina.
                  </div>
                ) : (
                  <input
                    value={radarQuery}
                    onChange={(event) => setRadarQuery(event.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:max-w-md"
                    placeholder="Buscar no radar por titulo, empresa, local ou origem..."
                  />
                )}
                <div className="text-sm text-slate-500">
                  {(isJobsPage ? jobsFilteredTrackedJobs : filteredTrackedJobs).length} item(ns) visivel(is)
                </div>
              </div>
            </div>
            {(isJobsPage ? jobsFilteredTrackedJobs : filteredTrackedJobs).length === 0 ? (
              <div className="bg-white/95 px-4 py-12 text-center text-sm text-slate-500">
                Nenhuma vaga encontrada com os filtros atuais.
              </div>
            ) : null}
            <div className="divide-y divide-slate-100 bg-white/95 md:hidden">
              {(isJobsPage ? jobsFilteredTrackedJobs : filteredTrackedJobs).map((job) => (
                <article
                  key={job.id}
                  className={`space-y-4 px-4 py-5 transition ${
                    activeTrackedJobId === job.id
                      ? "bg-[linear-gradient(180deg,rgba(240,249,255,0.9),rgba(255,255,255,0.95))]"
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
                    {isJobsPage ? (
                      <Link
                        className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                        href={`/jobs/${encodeURIComponent(job.id)}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Ver detalhe
                      </Link>
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
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
            <table className="hidden min-w-full divide-y divide-slate-200 text-left md:table">
              <thead className="bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))]">
                <tr className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  <th className="px-4 py-3 font-semibold">Vaga</th>
                  <th className="px-4 py-3 font-semibold">Origem</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/95">
                {(isJobsPage ? jobsFilteredTrackedJobs : filteredTrackedJobs).map((job) => (
                  <tr
                    key={job.id}
                    className={`cursor-pointer transition ${
                      activeTrackedJobId === job.id
                        ? "bg-[linear-gradient(90deg,rgba(240,249,255,0.9),rgba(255,255,255,0.96))]"
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
                      {isJobsPage ? (
                        <Link
                          className="mt-2 inline-flex text-sm font-semibold text-slate-950 hover:text-slate-700"
                          href={`/jobs/${encodeURIComponent(job.id)}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Ver detalhe
                        </Link>
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
                        {STATUS_OPTIONS.map((status) => (
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
        ) : null}
      </section>

      {isControlPage ? (
        <aside className="space-y-6">
        <div
          id="profile"
          className="rounded-[36px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
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
              <div className="rounded-[28px] border border-slate-900/80 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.98)_55%,rgba(14,165,233,0.72))] p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">
                    Siemens Germany
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Busca publica + enriquecimento do detalhe real da vaga.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunSiemensDiscovery}
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isDiscovering}
                >
                  {isDiscovering ? "Coletando..." : "Buscar vagas Siemens"}
                </button>
              </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Discovery mode
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      Traz cards reais e enriquece o detalhe quando a fonte permite.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Objetivo
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      Escolher rapido o que merece virar vaga ativa.
                    </p>
                  </div>
                </div>
              </div>

              {discoveryError ? (
                <div className="rounded-[24px] border border-rose-200 bg-[linear-gradient(90deg,rgba(255,241,242,0.96),rgba(255,255,255,0.94))] px-4 py-3 text-sm text-rose-700">
                  {discoveryError}
                </div>
              ) : null}

              <div className="rounded-[28px] border border-slate-200 bg-white/88 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
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
              </div>

              <div className="space-y-3">
                {discoveredJobs.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/75 px-5 py-6 text-sm leading-7 text-slate-500">
                    Traga vagas reais para este painel. A ideia aqui e manter o
                    discovery num lugar proprio e sem competir com o restante da
                    tela.
                  </div>
                ) : filteredDiscoveredJobs.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/75 px-5 py-6 text-sm leading-7 text-slate-500">
                    Nenhuma vaga descoberta bate com o filtro atual.
                  </div>
                ) : (
                  filteredDiscoveredJobs.map((job) => (
                    <article
                      key={job.listing.externalId}
                      className={`rounded-[28px] border p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition ${
                        activeDiscoveryId === job.listing.externalId
                          ? "border-sky-300 bg-sky-50/80 shadow-[0_18px_40px_rgba(14,165,233,0.12)]"
                          : "border-slate-200 bg-white/88"
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
                            className="rounded-full bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-3 py-2 text-sm font-medium text-white shadow-[0_12px_26px_rgba(15,23,42,0.16)] transition hover:brightness-105"
                          >
                            Tornar ativa
                          </button>
                          <a
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-sky-800 shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
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
              <div className="rounded-[28px] border border-slate-900/80 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(30,41,59,0.98)_55%,rgba(249,115,22,0.7))] p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-amber-300">
                    JD manual
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Cole qualquer descricao de vaga sem formatacao. O Argus
                    estrutura, pontua e joga para o radar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleProcessDescription}
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isPending}
                >
                  {isPending ? "Processando..." : "Estruturar"}
                </button>
              </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Fallback inteligente
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      Quando o crawler nao entra, o fluxo manual continua sem travar a operacao.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Resultado
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      O texto vira estrutura, score, mensagem e item no radar.
                    </p>
                  </div>
                </div>
              </div>

              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                className="min-h-[420px] w-full rounded-[30px] border border-slate-200 bg-white/90 px-5 py-4 text-sm leading-7 text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.04)] outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder="Cole aqui a vaga inteira, mesmo desorganizada."
              />
            </div>
          )}
        </div>

        <div className="rounded-[36px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,243,0.9))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Perfil e fontes
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {profile.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {profile.location} · {profile.availability}
          </p>

          <div className="mt-5 grid gap-4">
            <div className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Headline
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {profile.headline}
              </p>
            </div>
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

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/88 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Idiomas
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.languages.map((language) => (
                <span
                  key={language}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {sources.map((source) => (
              <article
                key={source.company}
                className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)]"
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
      ) : null}
    </div>
  );
}
