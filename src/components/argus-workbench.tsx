"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/context";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { DiscoveredJobListing } from "@/lib/connectors/types";
import {
  analyzeGaps,
  analyzeJobMatch,
  buildRecruiterMessage,
  parseJobDescription,
  type MatchAnalysis,
  type ParsedJob,
} from "@/lib/job-intake";
import {
  deriveCandidateProfile,
  type CandidateProfile,
  type PortalSource,
} from "@/lib/profile";
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
  initialDiscoverySource?: DiscoverySourceId;
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
type DiscoverySourceId = "siemens" | "rheinmetall" | "bwi" | "hensoldt" | "secunet" | "rohde-schwarz";
type ProfileSyncState = "checking" | "syncing" | "synced" | "offline" | "error";

const STORAGE_KEY = "argus-workbench-state";
const DISCOVERY_SOURCES: Record<
  DiscoverySourceId,
  {
    label: string;
    company: string;
    description: string;
    buttonLabel: string;
    endpoint: string;
  }
> = {
  siemens: {
    label: "Siemens",
    company: "Siemens",
    description: "Listagem pública alemã + enriquecimento por vaga.",
    buttonLabel: "Buscar vagas Siemens",
    endpoint: "/api/sources/siemens/discover?limit=6&enrich=1",
  },
  rheinmetall: {
    label: "Rheinmetall",
    company: "Rheinmetall",
    description: "Listagem pública com detalhe enriquecido por vaga.",
    buttonLabel: "Buscar vagas Rheinmetall",
    endpoint: "/api/sources/rheinmetall/discover?limit=6&enrich=1",
  },
  bwi: {
    label: "BWI",
    company: "BWI",
    description: "Stellenangebote portal com enriquecimento por item.",
    buttonLabel: "Buscar vagas BWI",
    endpoint: "/api/sources/bwi/discover?limit=6&enrich=1",
  },
  hensoldt: {
    label: "Hensoldt",
    company: "Hensoldt",
    description: "Portal de carreiras da Hensoldt Germany — defense & security.",
    buttonLabel: "Buscar vagas Hensoldt",
    endpoint: "/api/sources/hensoldt/discover?limit=6",
  },
  secunet: {
    label: "secunet",
    company: "secunet",
    description: "Portal público de segurança de TI — cybersecurity & software engineering.",
    buttonLabel: "Buscar vagas secunet",
    endpoint: "/api/sources/secunet/discover?limit=6",
  },
  "rohde-schwarz": {
    label: "Rohde & Schwarz",
    company: "Rohde & Schwarz",
    description: "Stellenangebote em software, embedded, R&D e telecomunicações.",
    buttonLabel: "Buscar vagas R&S",
    endpoint: "/api/sources/rohde-schwarz/discover?limit=6",
  },
};

function toTrackedJob(
  job: ParsedJob,
  analysis: MatchAnalysis,
  metadata: {
    intakeMode: string;
    sourceUrl?: string;
    externalId?: string;
    family?: string;
    strengths?: string[];
    risks?: string[];
    recruiterMessage?: string;
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
    strengths: metadata.strengths ?? analysis.strengths,
    risks: metadata.risks ?? analysis.risks,
    recruiterMessage: metadata.recruiterMessage,
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

function trackedJobToParsedJob(job: TrackedJob): ParsedJob {
  return {
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
}

function badgeStyle(score: number): React.CSSProperties {
  if (score >= 78) return { background: "#ecfdf5", color: "#047857", outline: "1px solid #a7f3d0" };
  if (score >= 60) return { background: "#fffbeb", color: "#b45309", outline: "1px solid #fde68a" };
  return { background: "#fff1f2", color: "#be123c", outline: "1px solid #fecdd3" };
}


function statusStyle(status: string): React.CSSProperties {
  if (status === "Aplicada" || status === "Entrevista") return { background: "#ecfdf5", color: "#047857", outline: "1px solid #a7f3d0" };
  if (status === "Aplicar" || status === "Pronta para revisar") return { background: "#eff6ff", color: "#1d4ed8", outline: "1px solid #bfdbfe" };
  return { background: "#f1f5f9", color: "#334155", outline: "1px solid #cbd5e1" };
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

function nextActionLabel(score: number, status?: string | null) {
  if (status === "Entrevista") {
    return "Preparar conversa";
  }

  if (status === "Aplicada") {
    return "Acompanhar retorno";
  }

  if (status === "Aplicar" || score >= 78) {
    return "Executar aplicacao";
  }

  if (status === "Pronta para revisar" || score >= 64) {
    return "Revisao final";
  }

  return "Triagem e contexto";
}

function formatActivityLabel(value?: string | null) {
  if (!value) {
    return "Ainda sem sync";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sem data valida";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function trackedJobLastTouch(job: TrackedJob) {
  return formatActivityLabel(
    job.updatedAt ?? job.history[job.history.length - 1]?.changedAt ?? job.createdAt,
  );
}

export function ArgusWorkbench({
  profile,
  sources,
  initialJobDescription,
  pageMode = "control",
  initialRadarQuery = "",
  initialActiveJobId,
  initialDiscoverySource,
}: ArgusWorkbenchProps) {
  const t = useT();
  const initialState = buildInitialState(profile, initialJobDescription);

  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [parsedJob, setParsedJob] = useState(initialState.parsedJob);
  const [analysis, setAnalysis] = useState(initialState.analysis);
  const [recruiterMessage, setRecruiterMessage] = useState(
    initialState.recruiterMessage,
  );
  const [_gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(() =>
    analyzeGap(initialState.parsedJob, profile, initialState.analysis)
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
  const [messageLang, setMessageLang] = useState<"en" | "de" | "pt">("en");
  const [radarFilter, setRadarFilter] = useState<RadarFilter>("all");
  const [radarQuery, setRadarQuery] = useState(initialRadarQuery);
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [selectedDiscoverySource, setSelectedDiscoverySource] =
    useState<DiscoverySourceId>("siemens");
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
    t("sync.checking"),
  );
  // true após o primeiro fetch do radar terminar (independente do resultado)
  const [radarLoaded, setRadarLoaded] = useState(false);
  // true se o radar foi carregado E tem vagas reais (não o estado inicial)
  const [hasRealJobs, setHasRealJobs] = useState(false);
  const [cvText, setCvText] = useState(profile.cvText);
  const [coverLetterText, setCoverLetterText] = useState(profile.coverLetterText);
  const [profileSyncState, setProfileSyncState] =
    useState<ProfileSyncState>("checking");
  const [profileSyncMessage, setProfileSyncMessage] = useState(
    "Conectando documentos server-side...",
  );
  const [hasStoredProfileDraft, setHasStoredProfileDraft] = useState(false);
  const [localProfileLoaded, setLocalProfileLoaded] = useState(false);
  const [remoteProfileChecked, setRemoteProfileChecked] = useState(false);
  const [lastSyncedDocuments, setLastSyncedDocuments] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDashboardPage = pageMode === "dashboard";
  const isJobsPage = pageMode === "jobs";
  const activeDiscoverySourceConfig = DISCOVERY_SOURCES[selectedDiscoverySource];
  const activeProfile = useMemo(
    () =>
      deriveCandidateProfile(profile, {
        cvText,
        coverLetterText,
      }),
    [coverLetterText, cvText, profile],
  );
  const documentSignature = useMemo(
    () => `${cvText.trim()}::${coverLetterText.trim()}`,
    [coverLetterText, cvText],
  );

  const applyAnalysisState = useCallback(
    (nextParsedJob: ParsedJob, nextAnalysis: MatchAnalysis) => {
      setParsedJob(nextParsedJob);
      setAnalysis(nextAnalysis);
      setRecruiterMessage(
        buildRecruiterMessage(nextParsedJob, activeProfile, nextAnalysis),
      );
      setGapAnalysis(analyzeGap(nextParsedJob, activeProfile, nextAnalysis));
    },
    [activeProfile],
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
        selectedDiscoverySource?: DiscoverySourceId;
        workspaceMode?: WorkspaceMode;
        activePanel?: ActivePanel;
        jobsSourceFilter?: string;
        jobsSeniorityFilter?: string;
        jobsMinimumScore?: string;
        jobsSort?: JobsSort;
        syncState?: "checking" | "connected" | "offline" | "error";
        syncMessage?: string;
        cvText?: string;
        coverLetterText?: string;
      };
      let storedDraftDetected = false;

      if (parsedState.jobDescription) setJobDescription(parsedState.jobDescription);
      if (parsedState.parsedJob) setParsedJob(parsedState.parsedJob);
      if (parsedState.analysis) setAnalysis(parsedState.analysis);
      if (parsedState.recruiterMessage) {
        setRecruiterMessage(parsedState.recruiterMessage);
      }
      if (parsedState.trackedJobs?.length) {
        setTrackedJobs(parsedState.trackedJobs);
        // Se o localStorage tem mais de 1 vaga ou a única tem createdAt, são vagas reais
        if (parsedState.trackedJobs.length > 1 || parsedState.trackedJobs[0]?.createdAt) {
          setHasRealJobs(true);
        }
      }
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
      if (parsedState.selectedDiscoverySource) {
        setSelectedDiscoverySource(parsedState.selectedDiscoverySource);
      }
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
      if (parsedState.cvText !== undefined) {
        setCvText(parsedState.cvText);
        storedDraftDetected = true;
      }
      if (parsedState.coverLetterText !== undefined) {
        setCoverLetterText(parsedState.coverLetterText);
        storedDraftDetected = true;
      }
      setHasStoredProfileDraft(storedDraftDetected);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLocalProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!localProfileLoaded) {
      return;
    }

    let isMounted = true;

    async function loadPersistedProfile() {
      try {
        const response = await fetch("/api/profile", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          available?: boolean;
          source?: "database" | "default";
          profile?: CandidateProfile;
          error?: string;
        };

        if (!isMounted) {
          return;
        }

        if (!response.ok || !payload.profile) {
          setProfileSyncState("error");
          setProfileSyncMessage(payload.error ?? "Falha ao carregar perfil do servidor");
          return;
        }

        const serverSignature = `${payload.profile.cvText.trim()}::${payload.profile.coverLetterText.trim()}`;
        setLastSyncedDocuments(serverSignature);

        if (!payload.available) {
          setProfileSyncState("offline");
          setProfileSyncMessage("Banco ainda nao configurado para sync server-side");
          return;
        }

        if (!hasStoredProfileDraft) {
          setCvText(payload.profile.cvText);
          setCoverLetterText(payload.profile.coverLetterText);
          setProfileSyncMessage("Documentos ativos carregados do banco");
        } else {
          setProfileSyncMessage("Draft local detectado e pronto para sincronizar");
        }

        setProfileSyncState("synced");
      } catch {
        if (!isMounted) {
          return;
        }

        setProfileSyncState("error");
        setProfileSyncMessage("Falha ao verificar documentos persistidos");
      } finally {
        if (isMounted) {
          setRemoteProfileChecked(true);
        }
      }
    }

    void loadPersistedProfile();

    return () => {
      isMounted = false;
    };
  }, [hasStoredProfileDraft, localProfileLoaded]);

  useEffect(() => {
    if (initialRadarQuery.trim().length > 0) {
      setRadarQuery(initialRadarQuery);
    }
  }, [initialRadarQuery]);

  useEffect(() => {
    if (initialDiscoverySource && DISCOVERY_SOURCES[initialDiscoverySource]) {
      setSelectedDiscoverySource(initialDiscoverySource);
    }
  }, [initialDiscoverySource]);

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

      const nextAnalysis = analyzeJobMatch(nextParsedJob, activeProfile);
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
  }, [activeProfile, applyAnalysisState, initialActiveJobId, trackedJobs]);

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
          setSyncMessage(payload.reason ?? t("sync.offline"));
          return;
        }

        setSyncState("connected");
        setSyncMessage(t("sync.connected"));

        if (payload.jobs.length > 0) {
          setHasRealJobs(true);
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
          const nextAnalysis = analyzeJobMatch(nextParsedJob, activeProfile);
          setParsedJob(nextParsedJob);
          setAnalysis(nextAnalysis);
          // Usar recruiterMessage persistido no DB se existir, senão gerar
          setRecruiterMessage(
            nextActiveJob.recruiterMessage ??
            buildRecruiterMessage(nextParsedJob, activeProfile, nextAnalysis),
          );
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setSyncState("error");
        setSyncMessage(t("sync.error"));
      } finally {
        if (isMounted) {
          setRadarLoaded(true);
        }
      }
    }

    void loadPersistedRadar();

    return () => {
      isMounted = false;
    };
  }, [activeProfile]);

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
        selectedDiscoverySource,
        workspaceMode,
        activePanel,
        jobsSourceFilter,
        jobsSeniorityFilter,
        jobsMinimumScore,
        jobsSort,
        syncState,
        syncMessage,
        cvText,
        coverLetterText,
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
    selectedDiscoverySource,
    workspaceMode,
    activePanel,
    jobsSourceFilter,
    jobsSeniorityFilter,
    jobsMinimumScore,
    jobsSort,
    syncState,
    syncMessage,
    cvText,
    coverLetterText,
  ]);

  useEffect(() => {
    if (!localProfileLoaded || !remoteProfileChecked) {
      return;
    }

    if (!cvText.trim() || !coverLetterText.trim()) {
      setProfileSyncState("error");
      setProfileSyncMessage("CV e cover letter precisam estar preenchidos para sync");
      return;
    }

    if (documentSignature === lastSyncedDocuments) {
      return;
    }

    setProfileSyncState("syncing");
    setProfileSyncMessage("Sincronizando CV e cover letter no servidor...");

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cvText,
              coverLetterText,
            }),
          });
          const payload = (await response.json()) as {
            error?: string;
            profile?: CandidateProfile;
          };

          if (!response.ok || !payload.profile) {
            if (response.status === 503) {
              setProfileSyncState("offline");
              setProfileSyncMessage(
                payload.error ?? "Banco ainda nao configurado para sync server-side",
              );
              return;
            }

            throw new Error(payload.error ?? "Falha ao sincronizar perfil no servidor");
          }

          const nextSignature = `${payload.profile.cvText.trim()}::${payload.profile.coverLetterText.trim()}`;
          setLastSyncedDocuments(nextSignature);
          setProfileSyncState("synced");
          setProfileSyncMessage("Documentos sincronizados com o banco");
        } catch (error) {
          setProfileSyncState("error");
          setProfileSyncMessage(
            error instanceof Error
              ? error.message
              : "Falha ao sincronizar documentos do perfil",
          );
        }
      })();
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    coverLetterText,
    cvText,
    documentSignature,
    lastSyncedDocuments,
    localProfileLoaded,
    remoteProfileChecked,
  ]);

  useEffect(() => {
    const nextAnalysis = analyzeJobMatch(parsedJob, activeProfile);
    setAnalysis(nextAnalysis);
    setRecruiterMessage(
      buildRecruiterMessage(parsedJob, activeProfile, nextAnalysis),
    );

    setTrackedJobs((currentJobs) =>
      currentJobs.map((job) => {
        const nextJobAnalysis = analyzeJobMatch(
          trackedJobToParsedJob(job),
          activeProfile,
        );

        return {
          ...job,
          score: nextJobAnalysis.score,
          verdict: nextJobAnalysis.verdict,
        };
      }),
    );

    setDiscoveredJobs((currentJobs) =>
      currentJobs.map((job) => ({
        ...job,
        analysis: analyzeJobMatch(job.parsedJob, activeProfile),
      })),
    );
  }, [activeProfile, parsedJob]);

  const priorityJobs = trackedJobs.filter((job) => job.score >= 70).length;
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
          activeProfile,
        )
      : null;
  const activeSourceLabel =
    activeTrackedJob?.intakeMode ??
    (activeDiscovery ? `${activeDiscovery.listing.source} crawler` : "Input manual");
  const matchMeterWidth = `${Math.max(10, Math.min(analysis.score, 100))}%`;

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

  // Recalcular recruiterMessage quando idioma muda
  useEffect(() => {
    setRecruiterMessage(buildRecruiterMessage(parsedJob, activeProfile, analysis, messageLang));
  }, [messageLang, parsedJob, activeProfile, analysis, t]);

  function handleProcessDescription() {
    startTransition(() => {
      const nextParsedJob = parseJobDescription(jobDescription);
      const nextAnalysis = analyzeJobMatch(nextParsedJob, activeProfile);
      const nextRecruiterMessage = buildRecruiterMessage(nextParsedJob, activeProfile, nextAnalysis);
      const nextTrackedJob = toTrackedJob(nextParsedJob, nextAnalysis, {
        intakeMode: "Input manual",
        strengths: nextAnalysis.strengths,
        risks: nextAnalysis.risks,
        recruiterMessage: nextRecruiterMessage,
      });

      applyAnalysisState(nextParsedJob, nextAnalysis);
      setTrackedJobs((currentJobs) => [nextTrackedJob, ...currentJobs.slice(0, 5)]);
      setActiveTrackedJobId(nextTrackedJob.id);
      setActiveDiscoveryId(null);
      setWorkspaceMode("manual");
      setActivePanel("summary");
      setHasRealJobs(true);
      void persistTrackedJob(nextTrackedJob, jobDescription);
    });
  }

  async function handleRunSourceDiscovery() {
    setIsDiscovering(true);
    setDiscoveryError(null);

    try {
      const response = await fetch(activeDiscoverySourceConfig.endpoint, {
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        error?: string;
        jobs: DiscoveredJobListing[];
      };

      if (!response.ok) {
        throw new Error(
          payload.error ?? `${activeDiscoverySourceConfig.company} discovery failed`,
        );
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
        const analysis = analyzeJobMatch(parsedJob, activeProfile);

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
      setHasRealJobs(true);
      const jobsToPersist: TrackedJob[] = [];
      setTrackedJobs((currentJobs) => {
        const seenIds = new Set(currentJobs.map((job) => job.id));
        const additions = nextDiscoveries
          .filter((job) => !seenIds.has(job.listing.externalId))
          .map((job) => {
              const msg = buildRecruiterMessage(job.parsedJob, activeProfile, job.analysis);
              return toTrackedJob(job.parsedJob, job.analysis, {
                intakeMode: `${job.listing.source} crawler`,
                sourceUrl: job.listing.sourceUrl,
                externalId: job.listing.externalId,
                family: job.listing.family,
                strengths: job.analysis.strengths,
                risks: job.analysis.risks,
                recruiterMessage: msg,
              });
            });

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

    const nextAnalysis = analyzeJobMatch(nextParsedJob, activeProfile);
    setActiveDiscoveryId(job.externalId ?? null);
    setActiveTrackedJobId(job.id);
    setJobDescription(
      [job.title, `Company: ${job.company}`, `Location: ${job.location}`, job.summary]
        .filter(Boolean)
        .join("\n"),
    );
    // Manter recruiterMessage persistido se disponível
    if (job.recruiterMessage) {
      setParsedJob(nextParsedJob);
      setAnalysis(nextAnalysis);
      setRecruiterMessage(job.recruiterMessage);
    } else {
      applyAnalysisState(nextParsedJob, nextAnalysis);
    }
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

  const activeTimeline =
    activeTrackedJob?.history.length && activeTrackedJob.history.length > 0
      ? activeTrackedJob.history
      : activeTrackedJob
        ? [createHistoryEntry(activeTrackedJob.status)]
        : [];
  const activeLastTouch =
    activeTrackedJob?.updatedAt ??
    activeTimeline[activeTimeline.length - 1]?.changedAt ??
    activeTrackedJob?.createdAt ??
    null;
  const activeNextAction = nextActionLabel(
    analysis.score,
    activeTrackedJob?.status ?? null,
  );
  const activeWorkspaceCards = [
    {
      label: "Signal",
      value: `${analysis.score}%`,
      detail: analysis.verdict,
    },
    {
      label: "Stage",
      value: activeTrackedJob?.status ?? "Nova leitura",
      detail: activeSourceLabel,
    },
    {
      label: "Next move",
      value: activeNextAction,
      detail:
        analysis.score >= 70
          ? "Ja ha contexto para agir."
          : "Vale triagem antes de executar.",
    },
    {
      label: "Last touch",
      value: formatActivityLabel(activeLastTouch),
      detail:
        activeTrackedJob?.intakeMode ??
        (activeDiscovery ? "Discovery live" : "Input manual"),
      },
  ];

  const controlSourceFocus =
    workspaceMode === "discovery"
      ? activeDiscoverySourceConfig.company
      : "Manual intake";
  const comparisonJobs = [...filteredTrackedJobs]
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
  const dashboardLanes = DASHBOARD_STATUS_LANES.map((status) => ({
    status,
    count: trackedJobs.filter((job) => job.status === status).length,
    jobs: trackedJobs.filter((job) => job.status === status).slice(0, 3),
  }));
  const jobsSpotlight = jobsFilteredTrackedJobs.slice(0, 3);
  const dashboardInterviewCount = trackedJobs.filter(
    (job) => job.status === "Entrevista",
  ).length;
  const dashboardExecutionCount = trackedJobs.filter((job) =>
    ["Aplicar", "Aplicada"].includes(job.status),
  ).length;

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  // Sync status pill
  const syncPill =
    syncState === "connected"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : syncState === "checking"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  const syncDot =
    syncState === "connected"
      ? "bg-emerald-500"
      : syncState === "checking"
        ? "bg-sky-500 animate-pulse"
        : "bg-amber-500";

  // ─── JOBS MODE ───────────────────────────────────────────────────────────────
  if (isJobsPage) {
    return (
      <div className="space-y-5">
        {/* Filters + sync row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Radar filter pills */}
          {(["all", "crawler", "manual", "priority"] as RadarFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setRadarFilter(f)}
              className={[
                "rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition",
                radarFilter === f
                  ? "border-slate-800 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {f === "all" ? t("jobs.all") : f === "crawler" ? t("jobs.filterCrawler") : f === "manual" ? t("jobs.filterManual") : "≥ 70%"}
            </button>
          ))}

          {/* Seniority filter */}
          <select
            value={jobsSeniorityFilter}
            onChange={(e) => setJobsSeniorityFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-700 outline-none"
          >
            <option value="all">Senioridade</option>
            {[...new Set(trackedJobs.map((j) => j.seniority).filter(Boolean))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            {/* Sync pill integrado */}
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${syncPill}`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${syncDot}`} />
              <span className="hidden sm:inline">{syncMessage}</span>
            </div>
            {/* Sort */}
            <select
              value={jobsSort}
              onChange={(e) => setJobsSort(e.target.value as JobsSort)}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-700 outline-none"
            >
              <option value="updated">Recentes</option>
              <option value="score">Score</option>
              <option value="company">Empresa</option>
            </select>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-500">
              {jobsFilteredTrackedJobs.length}
            </span>
          </div>
        </div>

        {/* Spotlight */}
        {jobsSpotlight.length > 0 && (
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Spotlight
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {jobsSpotlight.map((job, i) => (
                <button
                  key={`spot-${job.id}`}
                  type="button"
                  onClick={() => handleInspectTrackedJob(job)}
                  className={[
                    "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
                    activeTrackedJobId === job.id
                      ? "border-sky-300 bg-gradient-to-b from-sky-50 to-white shadow-[0_12px_32px_rgba(14,165,233,0.14)]"
                      : "border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:border-slate-300",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      #{i + 1}
                    </span>
                    <span style={badgeStyle(job.score)} className="rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                      {job.score}%
                    </span>
                  </div>
                  <p className="mt-2.5 text-[14px] font-semibold leading-snug text-slate-950">{job.title}</p>
                  <p className="mt-1 text-[12px] text-slate-500">{job.company} · {job.location}</p>
                  <p className="mt-3 text-[11px] font-semibold text-slate-400">
                    {nextActionLabel(job.score, job.status)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main grid — list + preview */}
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          {/* List */}
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            {/* List header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <p className="text-[12px] font-semibold text-slate-600">
                {radarQuery.trim() ? `Busca: "${radarQuery}"` : "Todos os resultados"}
              </p>
              <input
                value={radarQuery}
                onChange={(e) => setRadarQuery(e.target.value)}
                placeholder="Filtrar lista..."
                className="h-7 w-full max-w-[180px] rounded-full border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
              />
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {jobsFilteredTrackedJobs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[18px]">
                    ◎
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-600">
                      {radarFilter !== "all" || jobsSeniorityFilter !== "all"
                        ? "Nenhuma vaga para esses filtros"
                        : "Radar vazio"}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-400">
                      {radarFilter !== "all" || jobsSeniorityFilter !== "all"
                        ? "Tente remover os filtros ou reset para ver todos os resultados."
                        : "Adicione vagas pelo Control Center para começar o radar."}
                    </p>
                  </div>
                  {radarFilter !== "all" || jobsSeniorityFilter !== "all" ? (
                    <button
                      type="button"
                      onClick={() => { setRadarFilter("all"); setJobsSeniorityFilter("all"); }}
                      className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Limpar filtros
                    </button>
                  ) : (
                    <Link
                      href="/control-center"
                      className="rounded-full bg-slate-950 px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                    >
                      Ir para Control Center
                    </Link>
                  )}
                </div>
              ) : (
                jobsFilteredTrackedJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => {
                      setActiveTrackedJobId(job.id);
                      handleInspectTrackedJob(job);
                    }}
                    className={[
                      "flex w-full items-center gap-4 px-4 py-3.5 text-left transition",
                      activeTrackedJobId === job.id
                        ? "bg-sky-50"
                        : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {/* Score pill */}
                    <span style={badgeStyle(job.score)} className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                      {job.score}%
                    </span>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-950">{job.title}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{job.company} · {job.location}</p>
                    </div>
                    {/* Status + action */}
                    <div className="shrink-0 text-right">
                      <span style={statusStyle(job.status)} className="rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                        {job.status}
                      </span>
                      <p className="mt-1 text-[10px] text-slate-400">{trackedJobLastTouch(job)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Preview panel — hidden em mobile */}
          {jobsPreviewJob ? (
            <div className="hidden xl:block sticky top-[68px] space-y-3">
              {/* Job header */}
              <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Em foco
                    </p>
                    <h2 className="mt-1 text-[16px] font-semibold leading-snug text-slate-950">
                      {jobsPreviewJob.title}
                    </h2>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {jobsPreviewJob.company} · {jobsPreviewJob.location}
                    </p>
                  </div>
                  <span style={badgeStyle(jobsPreviewJob.score)} className="shrink-0 rounded-full px-3 py-1 text-[12px] font-bold">
                    {jobsPreviewJob.score}%
                  </span>
                </div>

                {/* Score bar */}
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all"
                    style={{ width: `${Math.max(8, Math.min(jobsPreviewJob.score, 100))}%` }}
                  />
                </div>

                {/* Quick facts */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { l: "Senioridade", v: jobsPreviewJob.seniority },
                    { l: "Modelo", v: jobsPreviewJob.workModel },
                    { l: "Contrato", v: jobsPreviewJob.employmentType },
                    { l: "Status", v: jobsPreviewJob.status },
                  ].map((item) => (
                    <div key={item.l} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.l}</p>
                      <p className="mt-0.5 text-[12px] font-semibold text-slate-800 truncate">{item.v || "—"}</p>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {jobsPreviewJob.summary && (
                  <p className="mt-4 text-[12px] leading-6 text-slate-500 line-clamp-3">
                    {jobsPreviewJob.summary}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/control-center?job=${jobsPreviewJob.id}`}
                    className="flex-1 rounded-full bg-slate-950 py-2 text-center text-[12px] font-semibold text-white transition hover:bg-slate-800"
                  >
                    Operar no CC
                  </Link>
                  <Link
                    href={`/jobs/${jobsPreviewJob.id}`}
                    className="flex-1 rounded-full border border-slate-200 bg-white py-2 text-center text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver detalhe
                  </Link>
                </div>
              </div>

              {/* Match preview */}
              {jobsPreviewAnalysis && (
                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Match</p>
                  <p className="mt-1.5 text-[14px] font-semibold text-slate-950">{jobsPreviewAnalysis.verdict}</p>
                  {jobsPreviewAnalysis.strengths.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {jobsPreviewAnalysis.strengths.slice(0, 3).map((s) => (
                        <div key={s} className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                          <p className="text-[12px] leading-5 text-slate-600">{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {jobsPreviewAnalysis.risks.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {jobsPreviewAnalysis.risks.slice(0, 2).map((r) => (
                        <div key={r} className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
                          <p className="text-[12px] leading-5 text-slate-500">{r}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 p-7 text-center">
              <p className="text-[13px] font-medium text-slate-500">
                {jobsFilteredTrackedJobs.length === 0
                  ? t("sync.noJobs")
                  : t("jobs.selectJob")}
              </p>
              {jobsFilteredTrackedJobs.length === 0 && (
                <div className="mt-4 flex justify-center gap-2">
                  <Link
                    href="/control-center"
                    className="rounded-full bg-slate-950 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                  >
                    Adicionar vaga
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DASHBOARD MODE ───────────────────────────────────────────────────────────
  if (isDashboardPage) {
    // Dashboard sem vagas reais — mostrar CTA de onboarding
    if (!hasRealJobs && radarLoaded) {
      return (
        <div className="space-y-5">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium ${syncPill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${syncDot}`} />
            {syncMessage}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="col-span-full rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl">
                ◎
              </div>
              <p className="mt-4 text-[15px] font-semibold text-slate-900">Pipeline vazio</p>
              <p className="mt-1.5 text-[13px] text-slate-500">
                Adicione vagas pelo Control Center para ver o funil, gargalos e prioridades aqui.
              </p>
              <div className="mt-5 flex justify-center gap-2.5">
                <Link href="/control-center" className="rounded-full bg-slate-950 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800">
                  Ir para Control Center
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Sync */}
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium ${syncPill}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${syncDot}`} />
          {syncMessage}
        </div>

        {/* KPIs row */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: t("dashboard.totalRadar"), value: trackedJobs.length, accent: false },
            { label: t("dashboard.highPriority"), value: priorityJobs, accent: true },
            { label: t("dashboard.inInterview"), value: dashboardInterviewCount, emerald: true },
            { label: t("dashboard.execQueue"), value: dashboardExecutionCount, amber: true },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={[
                "rounded-2xl border p-4",
                kpi.emerald ? "border-emerald-200/60 bg-gradient-to-b from-emerald-50 to-white" :
                kpi.amber ? "border-amber-200/60 bg-gradient-to-b from-amber-50 to-white" :
                kpi.accent ? "border-sky-200/60 bg-gradient-to-b from-sky-50 to-white" :
                "border-slate-200/60 bg-white",
              ].join(" ")}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Kanban board */}
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
          {dashboardLanes.map((lane) => (
            <section
              key={lane.status}
              className={`min-w-[240px] flex-shrink-0 rounded-2xl border p-4 sm:min-w-0 ${laneTone(lane.status)}`}
            >
              {/* Lane header */}
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {lane.status}
                </p>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[12px] font-bold text-slate-700">
                  {lane.count}
                </span>
              </div>

              {/* Cards */}
              <div className="max-h-[480px] space-y-2 overflow-y-auto">
                {lane.jobs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-[12px] text-slate-400">
                    Vazio
                  </div>
                ) : (
                  lane.jobs.map((job) => (
                    <div
                      key={`${lane.status}-${job.id}`}
                      className="rounded-xl border border-white/80 bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
                    >
                      <button
                        type="button"
                        onClick={() => handleInspectTrackedJob(job)}
                        className="w-full text-left"
                      >
                        <p className="text-[13px] font-semibold leading-snug text-slate-950">{job.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{job.company}</p>
                      </button>
                      {/* Score bar */}
                      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${Math.max(8, Math.min(job.score, 100))}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <span style={badgeStyle(job.score)} className="rounded-full px-2 py-0.5 text-[10px] font-bold">
                          {job.score}%
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleInspectTrackedJob(job)}
                            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Abrir
                          </button>
                          {job.status !== "Entrevista" && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceTrackedJob(job.id)}
                              title="Avançar stage"
                              className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-white transition hover:bg-slate-800"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Priority comparison */}
        {comparisonJobs.length > 0 && (
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Top oportunidades
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {comparisonJobs.map((job, i) => (
                <button
                  key={`cmp-${job.id}`}
                  type="button"
                  onClick={() => handleInspectTrackedJob(job)}
                  className={[
                    "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
                    i === 0
                      ? "border-sky-200/60 bg-gradient-to-b from-sky-50 to-white shadow-[0_8px_28px_rgba(14,165,233,0.10)]"
                      : "border-slate-200/60 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">#{i + 1}</span>
                    <span style={badgeStyle(job.score)} className="rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                      {job.score}%
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] font-semibold text-slate-950">{job.title}</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">{job.company} · {job.location}</p>
                  <p className="mt-3 text-[11px] font-semibold text-slate-400">{nextActionLabel(job.score, job.status)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── CONTROL CENTER MODE ──────────────────────────────────────────────────────

  // Welcome screen — radar ainda carregando ou sem vagas reais
  if (!radarLoaded || !hasRealJobs) {
    return (
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
        {/* Welcome / onboarding */}
        <div className="space-y-4">
          {/* Status bar */}
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium ${syncPill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${syncDot}`} />
            {!radarLoaded ? t("sync.checking") : syncMessage}
          </div>

          {!radarLoaded ? (
            /* Loading state */
            <div className="flex items-center justify-center rounded-[28px] border border-slate-200/60 bg-white py-20">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50">
                  <span className="text-xl">◎</span>
                </div>
                <p className="mt-4 text-[14px] font-semibold text-slate-700">Carregando radar...</p>
                <p className="mt-1 text-[12px] text-slate-400">Verificando vagas persistidas</p>
              </div>
            </div>
          ) : (
            /* Empty state — radar carregado mas sem vagas */
            <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
              {/* Header */}
              <div className="border-b border-slate-100 px-7 py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Control Center
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Radar vazio — adicione a primeira vaga
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-slate-500">
                  Use discovery real para puxar vagas dos portais conectados, ou cole um JD manualmente para começar.
                </p>
              </div>

              {/* Two action paths */}
              <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <button
                  type="button"
                  onClick={() => setWorkspaceMode("discovery")}
                  className="group flex flex-col gap-3 border-r border-slate-100 p-6 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 transition group-hover:border-sky-300 group-hover:bg-sky-100">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-950">Discovery real</p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      Puxe vagas diretamente dos portais Siemens, Rheinmetall e BWI com um clique.
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-sky-600 transition group-hover:translate-x-0.5">
                    Iniciar discovery →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceMode("manual")}
                  className="group flex flex-col gap-3 p-6 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition group-hover:border-slate-300 group-hover:bg-slate-100">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-950">Intake manual</p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      Cole qualquer JD — mesmo desorganizado. O Argus estrutura, calcula match e salva no radar.
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-600 transition group-hover:translate-x-0.5">
                    Colar JD →
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Intake area — sempre visível no welcome state */}
          {radarLoaded && (
            <div className="overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
              <div className="flex border-b border-slate-100">
                {(["discovery", "manual"] as WorkspaceMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWorkspaceMode(mode)}
                    className={[
                      "flex-1 py-3 text-[12px] font-semibold transition",
                      workspaceMode === mode
                        ? "border-b-2 border-sky-500 text-sky-700"
                        : "text-slate-500 hover:text-slate-700",
                    ].join(" ")}
                  >
                    {mode === "discovery" ? t("cc.discoveryReal") : t("cc.manualIntake")}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {workspaceMode === "discovery" ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(DISCOVERY_SOURCES) as [DiscoverySourceId, (typeof DISCOVERY_SOURCES)[DiscoverySourceId]][]).map(([id, src]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedDiscoverySource(id)}
                          className={[
                            "rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition",
                            selectedDiscoverySource === id
                              ? "border-slate-800 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {src.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[12px] leading-5 text-slate-500">
                      {activeDiscoverySourceConfig.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleRunSourceDiscovery()}
                      disabled={isDiscovering}
                      className="rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isDiscovering ? t("cc.searching") : activeDiscoverySourceConfig.buttonLabel}
                    </button>
                    {discoveryError && (
                      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12px] text-rose-700">
                        {discoveryError}
                      </p>
                    )}
                    {filteredDiscoveredJobs.length > 0 && (
                      <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                        {filteredDiscoveredJobs.map((job) => (
                          <button
                            key={job.listing.externalId}
                            type="button"
                            onClick={() => handleInspectDiscovery(job)}
                            className={[
                              "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                              activeDiscoveryId === job.listing.externalId ? "bg-sky-50" : "hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <span style={badgeStyle(job.analysis.score)} className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                              {job.analysis.score}%
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-slate-950">{job.listing.title}</p>
                              <p className="text-[11px] text-slate-500">{job.listing.location}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[12px] text-slate-500">
                      Cole o texto da vaga (mesmo desorganizado). O Argus estrutura, calcula match e salva no radar.
                    </p>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[200px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] leading-6 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
                      placeholder="Cole aqui a vaga inteira, mesmo desorganizada."
                    />
                    <button
                      type="button"
                      onClick={handleProcessDescription}
                      disabled={isPending}
                      className="rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isPending ? t("cc.processing") : t("cc.structureJob")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar mínima no welcome state */}
        <aside className="sticky top-[68px] space-y-4">
          <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Perfil ativo</p>
            <p className="mt-2 text-[14px] font-semibold text-slate-950">{activeProfile.name}</p>
            <p className="mt-1 text-[12px] text-slate-500">{activeProfile.location} · {activeProfile.availability}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {activeProfile.coreStack.slice(0, 5).map((s) => (
                <span key={s} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">{s}</span>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Sources live</p>
            <div className="mt-3 space-y-2">
              {sources.filter((s) => /live/i.test(s.status)).map((s) => (
                <div key={s.company} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[12px] font-medium text-slate-700">{s.company}</p>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">live</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
      {/* ── Main column ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Active job hero */}
        <div className="overflow-hidden rounded-[28px] border border-slate-900/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-6 py-3">
            <div className="flex items-center gap-2.5">
              <span className={`h-2 w-2 rounded-full ${syncDot}`} />
              <p className="text-[11px] font-medium text-slate-400">{syncMessage}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {controlSourceFocus}
              </span>
              {activeTrackedJob && (
                <select
                  value={activeTrackedJob.status}
                  onChange={(e) => handleUpdateTrackedJobStatus(activeTrackedJob.id, e.target.value)}
                  className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold text-slate-200 outline-none transition hover:bg-white/[0.12]"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="text-slate-950">{s}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Hero content */}
          <div className="px-6 py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400">
                    Vaga ativa
                  </p>
                  {parsedJob.company && (
                    <span className="rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {parsedJob.company}
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-2xl font-semibold leading-snug tracking-tight">
                  {parsedJob.title}
                </h1>
                <p className="mt-1 text-[13px] text-slate-400">
                  {parsedJob.location}{parsedJob.seniority ? ` · ${parsedJob.seniority}` : ""}
                </p>
              </div>

              {/* Score + next action */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span style={badgeStyle(analysis.score)} className="rounded-full px-3 py-1.5 text-[13px] font-bold">
                    {analysis.score}%
                  </span>
                  {activeTrackedJob && (
                    <span style={statusStyle(activeTrackedJob.status)} className="rounded-full px-3 py-1.5 text-[11px] font-bold">
                      {activeTrackedJob.status}
                    </span>
                  )}
                </div>
                <p className="text-[12px] font-semibold text-sky-400">{activeNextAction}</p>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-sky-400 transition-all"
                style={{ width: matchMeterWidth }}
              />
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {activeWorkspaceCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.05] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                  <p className="mt-1.5 text-[13px] font-semibold text-slate-100">{card.value}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{card.detail}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyRecruiterMessage}
                className="rounded-full bg-sky-500 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-sky-400"
              >
                {copiedState === "copied" ? t("cc.messageCopied") : t("cc.copyMessage")}
              </button>
              {activeDiscovery?.listing.sourceUrl && (
                <a
                  href={activeDiscovery.listing.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[12px] font-semibold text-slate-300 transition hover:bg-white/[0.12]"
                >
                  Vaga original ↗
                </a>
              )}
              {activeTrackedJob && (
                <button
                  type="button"
                  onClick={() => handleAdvanceTrackedJob(activeTrackedJob.id)}
                  className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[12px] font-semibold text-slate-300 transition hover:bg-white/[0.12]"
                >
                  Avançar stage →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Panel tabs */}
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100/60 p-1">
          {([
            { id: "summary", label: t("cc.tabSummary"), hint: parsedJob.title ? "✓" : "" },
            { id: "match", label: "Match", hint: `${analysis.score}%` },
            { id: "message", label: "Mensagem", hint: recruiterMessage ? "✓" : "" },
            { id: "history", label: t("cc.tabHistory"), hint: activeTrackedJob?.history.length ? `${activeTrackedJob.history.length}` : "" },
          ] as { id: ActivePanel; label: string; hint: string }[]).map((panel) => (
            <button
              key={panel.id}
              type="button"
              onClick={() => setActivePanel(panel.id)}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition",
                activePanel === panel.id
                  ? "bg-white text-slate-950 shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
                  : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {panel.label}
              {panel.hint && (
                <span className={[
                  "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                  activePanel === panel.id
                    ? "bg-sky-100 text-sky-700"
                    : "bg-slate-200 text-slate-500",
                ].join(" ")}>
                  {panel.hint}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div>
          {activePanel === "summary" && (
            <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
              {/* Role brief */}
              <div className="rounded-[24px] border border-slate-900/80 bg-gradient-to-b from-slate-950 to-slate-900 p-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">Role brief</p>
                <h3 className="mt-3 text-xl font-semibold">{parsedJob.title}</h3>
                <p className="mt-0.5 text-[12px] text-slate-300">{parsedJob.company} · {parsedJob.location}</p>
                <p className="mt-4 text-[13px] leading-6 text-slate-200">{parsedJob.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {parsedJob.skills.slice(0, 6).map((skill) => (
                    <span key={skill} className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[11px] font-medium text-slate-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              {/* Details */}
              <div className="space-y-2">
                {[
                  { l: "Senioridade", v: parsedJob.seniority },
                  { l: "Modelo", v: parsedJob.workModel },
                  { l: "Contrato", v: parsedJob.employmentType },
                  { l: "Idiomas", v: parsedJob.languages.join(", ") || "Não detectados" },
                ].map((item) => (
                  <div key={item.l} className="rounded-2xl border border-slate-200/60 bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{item.l}</p>
                    <p className="mt-1.5 text-[14px] font-semibold text-slate-950">{item.v || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePanel === "match" && (() => {
            const gaps = analyzeGaps(parsedJob, activeProfile);
            return (
              <div className="space-y-3">
                {/* Overall note */}
                <div className="rounded-2xl border border-slate-200/60 bg-slate-50 px-4 py-3">
                  <p className="text-[12px] text-slate-600">{gaps.overallNote}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Strengths */}
                  <div className="rounded-[24px] border border-slate-200/60 bg-white p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Strengths
                      {gaps.coveredSkills.length > 0 && (
                        <span className="ml-2 normal-case font-normal text-slate-400">({gaps.coveredSkills.length} skills cobertas)</span>
                      )}
                    </p>
                    <div className="mt-3 space-y-2">
                      {analysis.strengths.length === 0 ? (
                        <p className="text-[13px] text-slate-400">Sem pontos identificados.</p>
                      ) : (
                        analysis.strengths.map((s) => (
                          <div key={s} className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0 text-[14px] text-emerald-500">✓</span>
                            <p className="text-[13px] leading-5 text-slate-700">{s}</p>
                          </div>
                        ))
                      )}
                      {gaps.coveredSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {gaps.coveredSkills.map((s) => (
                            <span key={s} className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#ecfdf5", color: "#047857" }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gaps com posicionamento */}
                  <div className="rounded-[24px] border border-slate-200/60 bg-white p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Gaps & posicionamento
                      {gaps.gaps.length > 0 && (
                        <span className="ml-2 normal-case font-normal text-slate-400">({gaps.gaps.length} itens)</span>
                      )}
                    </p>
                    <div className="mt-3 space-y-3">
                      {gaps.gaps.length === 0 && !gaps.languageGap && !gaps.seniorityNote ? (
                        <p className="text-[13px] text-slate-400">Sem gaps críticos identificados.</p>
                      ) : (
                        <>
                          {gaps.gaps.map((g) => (
                            <div key={g.skill} className="rounded-xl border border-slate-100 p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold" style={{
                                  color: g.severity === "critical" ? "#be123c" : g.severity === "moderate" ? "#b45309" : "#64748b"
                                }}>
                                  {g.severity === "critical" ? "●" : g.severity === "moderate" ? "◐" : "○"}
                                </span>
                                <span className="text-[12px] font-semibold text-slate-800">{g.skill}</span>
                                <span className="ml-auto text-[10px] font-semibold uppercase" style={{
                                  color: g.severity === "critical" ? "#be123c" : g.severity === "moderate" ? "#b45309" : "#64748b"
                                }}>{g.severity}</span>
                              </div>
                              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{g.positioning}</p>
                            </div>
                          ))}
                          {gaps.languageGap && (
                            <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: "#fde68a", background: "#fffbeb" }}>
                              <p className="text-[11px] font-semibold text-amber-700">Idioma</p>
                              <p className="mt-1 text-[11px] leading-5 text-amber-600">{gaps.languageGap}</p>
                            </div>
                          )}
                          {gaps.seniorityNote && (
                            <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: "#bfdbfe", background: "#eff6ff" }}>
                              <p className="text-[11px] font-semibold text-blue-700">Senioridade</p>
                              <p className="mt-1 text-[11px] leading-5 text-blue-600">{gaps.seniorityNote}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {activePanel === "message" && (
            <div className="rounded-[24px] border border-slate-200/60 bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Recruiter message
                </p>
                <div className="flex items-center gap-2">
                  {/* Seletor de idioma */}
                  <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-50 p-0.5">
                    {(["en", "de", "pt"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setMessageLang(lang)}
                        className={[
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] transition",
                          messageLang === lang
                            ? "bg-slate-950 text-white"
                            : "text-slate-500 hover:text-slate-700",
                        ].join(" ")}
                      >
                        {lang === "en" ? "EN" : lang === "de" ? "DE" : "PT"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRecruiterMessage}
                    className="rounded-full bg-slate-950 px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                  >
                    {copiedState === "copied" ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[13px] leading-6 text-slate-700 font-sans">
                {recruiterMessage}
              </pre>
            </div>
          )}

          {activePanel === "history" && (
            <div className="rounded-[24px] border border-slate-200/60 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Histórico de status
              </p>
              <div className="mt-3 space-y-2">
                {activeTimeline.length === 0 ? (
                  <p className="text-[13px] text-slate-400">Sem histórico ainda.</p>
                ) : (
                  activeTimeline.map((entry, i) => (
                    <div
                      key={`${entry.status}-${entry.changedAt}-${i}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <span style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, background: statusStyle(entry.status).color ?? "#94a3b8" }} />
                      <p className="flex-1 text-[13px] font-medium text-slate-800">{entry.status}</p>
                      <p className="text-[11px] text-slate-400">{formatActivityLabel(entry.changedAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Intake area */}
        <div className="overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
          <div className="flex border-b border-slate-100">
            {(["discovery", "manual"] as WorkspaceMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setWorkspaceMode(mode)}
                className={[
                  "flex-1 py-3 text-[12px] font-semibold transition",
                  workspaceMode === mode
                    ? "border-b-2 border-sky-500 text-sky-700"
                    : "text-slate-500 hover:text-slate-700",
                ].join(" ")}
              >
                {mode === "discovery" ? t("cc.discoveryReal") : t("cc.manualIntake")}
              </button>
            ))}
          </div>

          <div className="p-5">
            {workspaceMode === "discovery" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(DISCOVERY_SOURCES) as [DiscoverySourceId, (typeof DISCOVERY_SOURCES)[DiscoverySourceId]][]).map(([id, src]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedDiscoverySource(id)}
                      className={[
                        "rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition",
                        selectedDiscoverySource === id
                          ? "border-slate-800 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] leading-5 text-slate-500">
                  {activeDiscoverySourceConfig.description}
                </p>
                <button
                  type="button"
                  onClick={() => void handleRunSourceDiscovery()}
                  disabled={isDiscovering}
                  className="rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isDiscovering ? t("cc.searching") : activeDiscoverySourceConfig.buttonLabel}
                </button>
                {discoveryError && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12px] text-rose-700">
                    {discoveryError}
                  </p>
                )}
                {filteredDiscoveredJobs.length > 0 && (
                  <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                    {filteredDiscoveredJobs.map((job) => (
                      <button
                        key={job.listing.externalId}
                        type="button"
                        onClick={() => handleInspectDiscovery(job)}
                        className={[
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                          activeDiscoveryId === job.listing.externalId
                            ? "bg-sky-50"
                            : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <span style={badgeStyle(job.analysis.score)} className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                          {job.analysis.score}%
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-slate-950">{job.listing.title}</p>
                          <p className="text-[11px] text-slate-400">{job.listing.location}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[12px] text-slate-500">
                  Cole o texto da vaga (mesmo desorganizado). O Argus estrutura, calcula match e salva no radar.
                </p>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] leading-6 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
                  placeholder="Cole aqui a vaga inteira, mesmo desorganizada."
                />
                <button
                  type="button"
                  onClick={handleProcessDescription}
                  disabled={isPending}
                  className="rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isPending ? t("cc.processing") : t("cc.structureJob")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="space-y-4 xl:sticky xl:top-[68px]">
        {/* Radar list */}
        <div className="overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-[12px] font-semibold text-slate-700">
              Radar ({trackedJobs.length})
            </p>
            <div className="flex gap-1">
              {(["all", "priority"] as ("all" | "priority")[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRadarFilter(f === "priority" ? "priority" : "all")}
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-bold transition",
                    (f === "priority" ? radarFilter === "priority" : radarFilter === "all")
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {f === "all" ? "Todos" : "≥70%"}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[320px] divide-y divide-slate-100 overflow-y-auto">
            {filteredTrackedJobs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                <p className="text-[12px] text-slate-400">
                  {radarFilter === "priority" ? "Nenhuma vaga com score ≥ 70%" : "Radar vazio"}
                </p>
                {radarFilter === "priority" && (
                  <button
                    type="button"
                    onClick={() => setRadarFilter("all")}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-500"
                  >
                    Ver todas
                  </button>
                )}
              </div>
            ) : (
              filteredTrackedJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => handleInspectTrackedJob(job)}
                  className={[
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                    activeTrackedJobId === job.id
                      ? "bg-sky-50 shadow-[inset_3px_0_0_#38bdf8]"
                      : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span style={badgeStyle(job.score)} className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {job.score}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-slate-950">{job.title}</p>
                    <p className="text-[11px] text-slate-400">{job.company}</p>
                  </div>
                  <span style={statusStyle(job.status)} className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                    {job.status.split(" ")[0]}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Profile sync */}
        <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
          {/* Header com status */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-slate-700">CV & Cover Letter</p>
            <span className={[
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
              profileSyncState === "synced" ? "bg-emerald-50 text-emerald-700" :
              profileSyncState === "syncing" ? "bg-sky-50 text-sky-700" :
              profileSyncState === "error" ? "bg-rose-50 text-rose-700" :
              "bg-slate-50 text-slate-500",
            ].join(" ")}>
              {profileSyncState === "synced" ? "✓ Sincronizado" :
               profileSyncState === "syncing" ? "Salvando..." :
               profileSyncState === "error" ? "Erro ao salvar" :
               profileSyncState === "offline" ? "Local" : "Verificando..."}
            </span>
          </div>

          {/* Info contextual */}
          <p className="mb-3 text-[11px] leading-5 text-slate-500">
            Atualizar o CV e a cover letter recalcula o match de todas as vagas automaticamente.
          </p>

          <div className="space-y-2.5">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">CV</span>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                className="mt-1 min-h-[110px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] leading-5 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
                placeholder="Cole o texto completo do seu CV..."
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Cover letter</span>
              <textarea
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] leading-5 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
                placeholder="Cole o parágrafo base da sua cover letter..."
              />
            </label>
          </div>

          {/* Feedback de último sync */}
          {profileSyncState !== "checking" && (
            <p className="mt-2.5 text-[10px] text-slate-400">{profileSyncMessage}</p>
          )}
        </div>
      </aside>
    </div>
  );
}
