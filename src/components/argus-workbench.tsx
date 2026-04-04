"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/context";
import { buildInterviewPrep, type InterviewPrep } from "@/lib/interview-prep";
import { buildCandidacyPackage, downloadCandidacyPackage } from "@/lib/export-candidacy";
import { computePipelineAnalytics } from "@/lib/pipeline-analytics";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { DiscoveredJobListing } from "@/lib/connectors/types";
import {
  adjustScoreForTiming,
  analyzeGap,
  analyzeJobMatch,
  buildCustomCoverParagraph,
  buildRecruiterMessage,
  parseJobDescription,
  type GapAnalysis,
  type MatchAnalysis,
  type ParsedJob,
} from "@/lib/job-intake";
import {
  deriveCandidateProfile,
  type CandidateProfile,
  type PortalSource,
} from "@/lib/profile";
import { deduplicateJobs } from "@/lib/connectors/dedup";
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
type ActivePanel = "summary" | "match" | "gap" | "message" | "history" | "interview";
type JobsSort = "updated" | "score" | "company";
type DiscoverySourceId = "siemens" | "rheinmetall" | "bwi" | "hensoldt" | "secunet" | "rohde-schwarz" | "airbus" | "bayer" | "sap" | "eviden" | "diehl" | "tkms";
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
    buttonLabel: "Search R&S jobs",
    endpoint: "/api/sources/rohde-schwarz/discover?limit=6",
  },
  airbus: {
    label: "Airbus",
    company: "Airbus",
    description: "Careers portal with Germany filter — software, digital and engineering roles.",
    buttonLabel: "Search Airbus jobs",
    endpoint: "/api/sources/airbus/discover?limit=6",
  },
  bayer: {
    label: "Bayer",
    company: "Bayer",
    description: "Phenom People portal — life sciences, digital health and R&D engineering.",
    buttonLabel: "Search Bayer jobs",
    endpoint: "/api/sources/bayer/discover?limit=6",
  },
  sap: {
    label: "SAP",
    company: "SAP",
    description: "Greenhouse API — software engineering, cloud, security and data roles in Germany.",
    buttonLabel: "Search SAP jobs",
    endpoint: "/api/sources/sap/discover?limit=6",
  },
  eviden: {
    label: "Eviden",
    company: "Eviden",
    description: "SmartRecruiters — cybersecurity, cloud and digital transformation roles.",
    buttonLabel: "Search Eviden jobs",
    endpoint: "/api/sources/eviden/discover?limit=6",
  },
  diehl: {
    label: "Diehl",
    company: "Diehl",
    description: "Defense & engineering — embedded, software and systems roles in Germany.",
    buttonLabel: "Search Diehl jobs",
    endpoint: "/api/sources/diehl/discover?limit=6",
  },
  tkms: {
    label: "TKMS",
    company: "TKMS",
    description: "thyssenkrupp Marine Systems — naval engineering, IT and systems roles.",
    buttonLabel: "Search TKMS jobs",
    endpoint: "/api/sources/tkms/discover?limit=6",
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
  if (score >= 78) return { background: "rgba(16,185,129,.15)", color: "#10b981", outline: "1px solid rgba(16,185,129,.3)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 };
  if (score >= 60) return { background: "rgba(245,158,11,.15)", color: "#f59e0b", outline: "1px solid rgba(245,158,11,.3)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 };
  return { background: "rgba(239,68,68,.15)", color: "#ef4444", outline: "1px solid rgba(239,68,68,.3)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 };
}

function statusStyle(status: string): React.CSSProperties {
  if (status === "Aplicada" || status === "Entrevista") return { background: "rgba(16,185,129,.15)", color: "#10b981", outline: "1px solid rgba(16,185,129,.3)", borderRadius: "999px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 };
  if (status === "Aplicar" || status === "Pronta para revisar") return { background: "rgba(59,130,246,.15)", color: "#3b82f6", outline: "1px solid rgba(59,130,246,.3)", borderRadius: "999px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 };
  return { background: "rgba(100,116,139,.15)", color: "#94a3b8", outline: "1px solid rgba(100,116,139,.3)", borderRadius: "999px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 };
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

function daysSince(isoDate?: string | null): number | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function followUpUrgency(job: TrackedJob): "overdue" | "due-soon" | "ok" | null {
  if (job.status !== "Aplicada") return null;
  const days = daysSince(job.updatedAt ?? job.history[0]?.changedAt);
  if (days === null) return null;
  if (days >= 14) return "overdue";
  if (days >= 7) return "due-soon";
  return "ok";
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
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(() =>
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
  const [coverLang, setCoverLang] = useState<"en" | "de" | "pt">("en");
  const [customCover, setCustomCover] = useState(() =>
    buildCustomCoverParagraph(initialState.parsedJob, profile, initialState.analysis, "en")
  );
  const [coverCopied, setCoverCopied] = useState(false);
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrep | null>(null);
  const [exportState, setExportState] = useState<"idle" | "done">("idle");
  const analytics = useMemo(
    () => computePipelineAnalytics(trackedJobs),
    [trackedJobs]
  );
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
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
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
  const [cvUploadState, setCvUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [cvUploadMsg, setCvUploadMsg] = useState("");
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
  }, [activeProfile, t]);

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

  // Recalcular customCover quando idioma muda
  useEffect(() => {
    setCustomCover(buildCustomCoverParagraph(parsedJob, activeProfile, analysis, coverLang));
  }, [coverLang, parsedJob, activeProfile, analysis]);

  // Calcular interview prep quando vaga está em Entrevista
  useEffect(() => {
    if (activeTrackedJob?.status === "Entrevista") {
      setInterviewPrep(buildInterviewPrep(parsedJob, activeProfile));
    } else {
      setInterviewPrep(null);
    }
  }, [activeTrackedJob?.status, parsedJob, activeProfile]);

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
        const baseAnalysis = analyzeJobMatch(parsedJob, activeProfile);
        // Aplicar bônus/penalidade de timing se a vaga tem data de publicação
        const timedScore = adjustScoreForTiming(baseAnalysis.score, listing.postedSince ?? null);
        const analysis = timedScore !== baseAnalysis.score
          ? { ...baseAnalysis, score: timedScore }
          : baseAnalysis;

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
        const candidates = nextDiscoveries.map((job) => {
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

        // Deduplicação robusta: externalId + fingerprint título+empresa
        const { additions } = deduplicateJobs(candidates, currentJobs);

        jobsToPersist.push(...additions);
        return [...additions, ...currentJobs].slice(0, 50);
      });
      // Alerta proativo para vagas com score ≥80
      const alertJobs = jobsToPersist
        .filter((j) => j.score >= 80)
        .map((j) => ({ id: j.id, title: j.title, company: j.company, score: j.score, sourceUrl: j.sourceUrl }));
      if (alertJobs.length > 0) {
        void fetch("/api/radar/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobs: alertJobs }),
        }).catch(() => { /* alert failure is non-critical */ });
      }

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

  const syncDotColor =
    syncState === "connected" ? "#10b981" : syncState === "checking" ? "#3b82f6" : "#f59e0b";

  // ─── INTAKE AREA (shared between CC welcome + main workbench) ─────────────────
  function renderIntakeArea() {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {(["discovery", "manual"] as WorkspaceMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setWorkspaceMode(mode)}
              style={{
                flex: 1, padding: "12px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                background: "none", border: "none",
                borderBottom: workspaceMode === mode ? "2px solid var(--gold)" : "2px solid transparent",
                color: workspaceMode === mode ? "var(--gold)" : "var(--dim)",
              }}
            >
              {mode === "discovery" ? t("cc.discoveryReal") : t("cc.manualIntake")}
            </button>
          ))}
        </div>
        <div style={{ padding: "20px" }}>
          {workspaceMode === "discovery" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(Object.entries(DISCOVERY_SOURCES) as [DiscoverySourceId, (typeof DISCOVERY_SOURCES)[DiscoverySourceId]][]).map(([id, src]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedDiscoverySource(id)}
                    style={{
                      borderRadius: "999px",
                      border: selectedDiscoverySource === id ? "1px solid var(--gold)" : "1px solid var(--border)",
                      background: selectedDiscoverySource === id ? "rgba(245,158,11,.12)" : "var(--surf)",
                      color: selectedDiscoverySource === id ? "var(--gold)" : "var(--muted)",
                      padding: "4px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
              <p style={{ color: "var(--dim)", fontSize: "12px", lineHeight: 1.5 }}>{activeDiscoverySourceConfig.description}</p>
              <button
                type="button"
                onClick={() => void handleRunSourceDiscovery()}
                disabled={isDiscovering}
                style={{ background: "var(--gold)", color: "#020810", borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: "none", opacity: isDiscovering ? 0.5 : 1, alignSelf: "flex-start" }}
              >
                {isDiscovering ? t("cc.searching") : activeDiscoverySourceConfig.buttonLabel}
              </button>
              {discoveryError && (
                <p style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#ef4444" }}>
                  {discoveryError}
                </p>
              )}
              {filteredDiscoveredJobs.length > 0 && (
                <div style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                  {filteredDiscoveredJobs.map((job) => (
                    <button
                      key={job.listing.externalId}
                      type="button"
                      onClick={() => handleInspectDiscovery(job)}
                      style={{
                        display: "flex", width: "100%", alignItems: "center", gap: "10px",
                        padding: "10px 14px", textAlign: "left", cursor: "pointer", border: "none",
                        borderBottom: "1px solid var(--border)",
                        background: activeDiscoveryId === job.listing.externalId ? "rgba(245,158,11,.08)" : "transparent",
                      }}
                    >
                      <span style={badgeStyle(job.analysis.score)}>{job.analysis.score}%</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.listing.title}</p>
                        <p style={{ color: "var(--dim)", fontSize: "11px" }}>{job.listing.company} · {job.listing.location}</p>
                        {job.analysis.strengths[0] && (
                          <p style={{ color: "#10b981", fontSize: "10px" }}>✓ {job.analysis.strengths[0]}</p>
                        )}
                      </div>
                      <span style={{ color: "var(--gold)", fontSize: "10px" }}>→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ color: "var(--dim)", fontSize: "12px", lineHeight: 1.5 }}>Cole o texto da vaga (mesmo desorganizado). O Argus estrutura, calcula match e salva no radar.</p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{ width: "100%", minHeight: "180px", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px", fontSize: "13px", lineHeight: 1.6, color: "var(--text)", outline: "none", resize: "vertical" }}
                placeholder="Cole aqui a vaga inteira, mesmo desorganizada."
              />
              <button
                type="button"
                onClick={handleProcessDescription}
                disabled={isPending}
                style={{ background: "var(--gold)", color: "#020810", borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: "none", opacity: isPending ? 0.5 : 1, alignSelf: "flex-start" }}
              >
                {isPending ? t("cc.processing") : t("cc.structureJob")}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── JOBS MODE ───────────────────────────────────────────────────────────────
  if (isJobsPage) {
    const filterLabels: Record<RadarFilter, string> = {
      all: "Todas",
      crawler: "Crawler",
      manual: "Manual",
      priority: "≥ 70%",
    };

    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>

        {/* ── Filter bar ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          {(["all", "crawler", "manual", "priority"] as RadarFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setRadarFilter(f)}
              style={{
                borderRadius: "999px",
                border: radarFilter === f ? "1px solid var(--gold)" : "1px solid var(--border)",
                background: radarFilter === f ? "rgba(245,158,11,.12)" : "var(--surf)",
                color: radarFilter === f ? "var(--gold)" : "var(--muted)",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              {filterLabels[f]}
            </button>
          ))}

          <select
            value={jobsSeniorityFilter}
            onChange={(e) => setJobsSeniorityFilter(e.target.value)}
            style={{
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "var(--surf)",
              color: "var(--muted)",
              padding: "5px 14px",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">Senioridade</option>
            {[...new Set(trackedJobs.map((j) => j.seniority).filter(Boolean))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Sync indicator */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "999px", padding: "4px 10px", fontSize: "11px", color: "var(--dim)" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: syncDotColor, flexShrink: 0 }} />
              <span>{syncMessage}</span>
            </div>

            {/* Sort */}
            <select
              value={jobsSort}
              onChange={(e) => setJobsSort(e.target.value as JobsSort)}
              style={{
                borderRadius: "999px",
                border: "1px solid var(--border)",
                background: "var(--surf)",
                color: "var(--muted)",
                padding: "5px 14px",
                fontSize: "12px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="updated">Recentes</option>
              <option value="score">Score</option>
              <option value="company">Empresa</option>
            </select>

            {/* Search */}
            <input
              value={radarQuery}
              onChange={(e) => setRadarQuery(e.target.value)}
              placeholder="Filtrar..."
              style={{
                background: "var(--surf)",
                border: "1px solid var(--border)",
                borderRadius: "999px",
                padding: "5px 14px",
                fontSize: "12px",
                color: "var(--text)",
                outline: "none",
                width: "150px",
              }}
            />

            {/* Count */}
            <span style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "999px", padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "var(--dim)" }}>
              {jobsFilteredTrackedJobs.length}
            </span>
          </div>
        </div>

        {/* ── Grid: list + sidebar ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 xl:grid" style={{ gridTemplateColumns: "1fr 272px", alignItems: "start" }}>

          {/* Job list */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>

            {/* Spotlight strip */}
            {jobsSpotlight.length > 0 && (
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "10px" }}>
                  Spotlight
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {jobsSpotlight.map((job, i) => (
                    <button
                      key={`spot-${job.id}`}
                      type="button"
                      onClick={() => { setActiveTrackedJobId(job.id); handleInspectTrackedJob(job); }}
                      style={{
                        background: activeTrackedJobId === job.id ? "rgba(245,158,11,.08)" : "var(--surf)",
                        border: activeTrackedJobId === job.id ? "1px solid var(--gold)" : "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "12px",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all .15s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <span style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700 }}>#{i + 1}</span>
                        <span style={badgeStyle(job.score)}>{job.score}%</span>
                      </div>
                      <p style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600, lineHeight: 1.3, marginBottom: "4px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{job.title}</p>
                      <p style={{ color: "var(--dim)", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.company}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {jobsFilteredTrackedJobs.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "48px 20px", textAlign: "center" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surf)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "var(--dim)" }}>◎</div>
                <div>
                  <p style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {radarFilter !== "all" || jobsSeniorityFilter !== "all" ? "Nenhuma vaga para esses filtros" : "Radar vazio"}
                  </p>
                  <p style={{ color: "var(--dim)", fontSize: "12px" }}>
                    {radarFilter !== "all" || jobsSeniorityFilter !== "all"
                      ? "Tente remover os filtros para ver todos os resultados."
                      : "Adicione vagas pelo Control Center para começar."}
                  </p>
                </div>
                {radarFilter !== "all" || jobsSeniorityFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => { setRadarFilter("all"); setJobsSeniorityFilter("all"); }}
                    style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "999px", padding: "6px 16px", fontSize: "12px", fontWeight: 600, color: "var(--muted)", cursor: "pointer" }}
                  >
                    Limpar filtros
                  </button>
                ) : (
                  <Link
                    href="/control-center"
                    style={{ background: "var(--gold)", color: "#020810", borderRadius: "999px", padding: "6px 16px", fontSize: "12px", fontWeight: 700 }}
                  >
                    Adicionar vaga
                  </Link>
                )}
              </div>
            ) : (
              /* Job rows */
              jobsFilteredTrackedJobs.map((job) => {
                const isActive = activeTrackedJobId === job.id;
                const isExpanded = expandedJobId === job.id;
                return (
                  <div
                    key={job.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      padding: "14px 20px",
                      background: isActive ? "rgba(245,158,11,.05)" : "transparent",
                      transition: "background .15s",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setActiveTrackedJobId(job.id);
                      handleInspectTrackedJob(job);
                      setExpandedJobId(isExpanded ? null : job.id);
                    }}
                  >
                    {/* Row collapsed: score + title + company + status + apply */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={badgeStyle(job.score)}>{job.score}%</span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.title}
                        </p>
                        <p style={{ color: "var(--dim)", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.company}{job.location ? ` · ${job.location}` : ""}
                          {job.workModel && job.workModel !== "Not specified" ? ` · ${job.workModel}` : ""}
                        </p>
                      </div>

                      <span style={statusStyle(job.status)}>{job.status}</span>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {job.sourceUrl && (
                          <a
                            href={job.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ background: "var(--gold)", color: "#020810", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}
                          >
                            Aplicar ↗
                          </a>
                        )}
                        <Link
                          href={`/jobs/${job.id}`}
                          style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 600 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver →
                        </Link>
                      </div>
                    </div>

                    {/* Row expanded: strengths + gaps + tags */}
                    {isExpanded && (
                      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          {job.strengths && job.strengths.length > 0 && (
                            <div>
                              <p style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: "6px" }}>Pontos fortes</p>
                              {job.strengths.slice(0, 3).map((s) => (
                                <div key={s} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
                                  <span style={{ color: "#10b981", fontSize: "11px", marginTop: "1px" }}>✓</span>
                                  <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: 1.5 }}>{s}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {job.risks && job.risks.length > 0 && (
                            <div>
                              <p style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: "6px" }}>Gaps / Riscos</p>
                              {job.risks.slice(0, 3).map((r) => (
                                <div key={r} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
                                  <span style={{ color: "#f59e0b", fontSize: "11px", marginTop: "1px" }}>⚠</span>
                                  <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: 1.5 }}>{r}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {job.skills && job.skills.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "10px" }}>
                            {job.skills.slice(0, 8).map((skill) => (
                              <span key={skill} style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--dim)", borderRadius: "4px", padding: "2px 7px", fontSize: "11px" }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                          <Link
                            href={`/control-center?job=${job.id}`}
                            style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "6px", padding: "5px 14px", fontSize: "12px", fontWeight: 600 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Operar no CC
                          </Link>
                          <Link
                            href={`/jobs/${job.id}`}
                            style={{ color: "var(--dim)", fontSize: "12px", padding: "5px 0" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Detalhe completo →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <div className="hidden xl:flex" style={{ flexDirection: "column", gap: "12px", position: "sticky", top: "70px" }}>

            {/* Pipeline counts */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "12px" }}>
                Pipeline
              </div>
              {DASHBOARD_STATUS_LANES.map((status) => {
                const count = trackedJobs.filter((j) => j.status === status).length;
                return (
                  <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--muted)", fontSize: "12px" }}>{status}</span>
                    <span style={{ color: count > 0 ? "var(--text)" : "var(--dim)", fontSize: "12px", fontWeight: count > 0 ? 700 : 400 }}>{count}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", marginTop: "2px" }}>
                <span style={{ color: "var(--dim)", fontSize: "11px" }}>Total</span>
                <span style={{ color: "var(--gold)", fontSize: "12px", fontWeight: 700 }}>{trackedJobs.length}</span>
              </div>
            </div>

            {/* Active job preview */}
            {jobsPreviewJob && (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "12px" }}>
                  Em Foco
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600, lineHeight: 1.3 }}>{jobsPreviewJob.title}</p>
                    <p style={{ color: "var(--dim)", fontSize: "11px", marginTop: "3px" }}>{jobsPreviewJob.company}</p>
                  </div>
                  <span style={badgeStyle(jobsPreviewJob.score)}>{jobsPreviewJob.score}%</span>
                </div>

                {/* Score bar */}
                <div style={{ height: "3px", background: "var(--border)", borderRadius: "999px", overflow: "hidden", marginBottom: "12px" }}>
                  <div style={{ height: "100%", width: `${Math.max(4, Math.min(jobsPreviewJob.score, 100))}%`, background: jobsPreviewJob.score >= 78 ? "#10b981" : jobsPreviewJob.score >= 60 ? "#f59e0b" : "#ef4444", borderRadius: "999px", transition: "width .3s" }} />
                </div>

                {/* Quick facts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                  {[
                    { l: "Seniority", v: jobsPreviewJob.seniority },
                    { l: "Modelo", v: jobsPreviewJob.workModel },
                    { l: "Status", v: jobsPreviewJob.status },
                    { l: "Contrato", v: jobsPreviewJob.employmentType },
                  ].map((item) => (
                    <div key={item.l} style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 8px" }}>
                      <p style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.l}</p>
                      <p style={{ color: "var(--muted)", fontSize: "11px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>{item.v || "—"}</p>
                    </div>
                  ))}
                </div>

                {/* Match preview */}
                {jobsPreviewAnalysis && (
                  <>
                    {jobsPreviewAnalysis.strengths.slice(0, 2).map((s) => (
                      <div key={s} style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ color: "#10b981", fontSize: "11px", flexShrink: 0, marginTop: "1px" }}>✓</span>
                        <p style={{ color: "var(--muted)", fontSize: "11px", lineHeight: 1.5 }}>{s}</p>
                      </div>
                    ))}
                    {jobsPreviewAnalysis.risks.slice(0, 1).map((r) => (
                      <div key={r} style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ color: "#f59e0b", fontSize: "11px", flexShrink: 0, marginTop: "1px" }}>⚠</span>
                        <p style={{ color: "var(--dim)", fontSize: "11px", lineHeight: 1.5 }}>{r}</p>
                      </div>
                    ))}
                  </>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                  <Link
                    href={`/control-center?job=${jobsPreviewJob.id}`}
                    style={{ flex: 1, background: "var(--gold)", color: "#020810", borderRadius: "6px", padding: "7px 0", textAlign: "center", fontSize: "12px", fontWeight: 700 }}
                  >
                    Operar no CC
                  </Link>
                  <Link
                    href={`/jobs/${jobsPreviewJob.id}`}
                    style={{ flex: 1, background: "var(--surf)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "6px", padding: "7px 0", textAlign: "center", fontSize: "12px", fontWeight: 600 }}
                  >
                    Detalhe
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD MODE ───────────────────────────────────────────────────────────
  if (isDashboardPage) {
    // Empty state
    if (!hasRealJobs && radarLoaded) {
      return (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surf)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "var(--dim)", margin: "0 auto 16px" }}>◎</div>
            <p style={{ color: "var(--text)", fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>Pipeline vazio</p>
            <p style={{ color: "var(--dim)", fontSize: "13px", marginBottom: "20px" }}>Adicione vagas pelo Control Center para ver o funil, gargalos e prioridades aqui.</p>
            <Link href="/control-center" style={{ background: "var(--gold)", color: "#020810", borderRadius: "6px", padding: "8px 20px", fontSize: "12px", fontWeight: 700 }}>
              Ir para Control Center
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>

        {/* ── KPI cards ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ marginBottom: "20px" }}>
          {[
            { label: t("dashboard.totalRadar"), value: trackedJobs.length, color: "var(--text)", accent: null },
            { label: t("dashboard.highPriority"), value: priorityJobs, color: "#3b82f6", accent: "rgba(59,130,246,.08)" },
            { label: t("dashboard.inInterview"), value: dashboardInterviewCount, color: "#10b981", accent: "rgba(16,185,129,.08)" },
            { label: t("dashboard.execQueue"), value: dashboardExecutionCount, color: "#f59e0b", accent: "rgba(245,158,11,.08)" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: kpi.accent ?? "var(--card)",
                border: `1px solid ${kpi.accent ? kpi.color.replace(")", ", .25)").replace("rgb", "rgba") : "var(--border)"}`,
                borderRadius: "10px",
                padding: "16px 18px",
              }}
            >
              <p style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>{kpi.label}</p>
              <p style={{ color: kpi.color, fontSize: "32px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ── Main: top spotlight + pipeline ──────────────────────────────────── */}
        <div className="flex flex-col gap-4 xl:grid" style={{ gridTemplateColumns: "1fr 272px", alignItems: "start" }}>

          {/* Left: spotlight + kanban */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Top oportunidades */}
            {comparisonJobs.length > 0 && (
              <div>
                <div style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "10px" }}>
                  Top Oportunidades
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {comparisonJobs.map((job, i) => (
                    <button
                      key={`cmp-${job.id}`}
                      type="button"
                      onClick={() => handleInspectTrackedJob(job)}
                      style={{
                        background: i === 0 ? "rgba(245,158,11,.06)" : "var(--card)",
                        border: i === 0 ? "1px solid var(--gold)" : "1px solid var(--border)",
                        borderRadius: "10px",
                        padding: "14px 16px",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all .15s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <span style={{ color: i === 0 ? "var(--gold)" : "var(--dim)", fontSize: "10px", fontWeight: 700 }}>#{i + 1}</span>
                        <span style={badgeStyle(job.score)}>{job.score}%</span>
                      </div>
                      <p style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600, lineHeight: 1.3, marginBottom: "4px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{job.title}</p>
                      <p style={{ color: "var(--dim)", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "8px" }}>{job.company} · {job.location}</p>
                      <p style={{ color: i === 0 ? "var(--gold)" : "var(--dim)", fontSize: "11px", fontWeight: 600 }}>{nextActionLabel(job.score, job.status)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kanban lanes */}
            <div>
              <div style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "10px" }}>
                Funil
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
                {dashboardLanes.map((lane) => {
                  const laneColor =
                    lane.status === "Entrevista" ? "#10b981" :
                    lane.status === "Aplicada" || lane.status === "Aplicar" ? "#3b82f6" :
                    lane.status === "Pronta para revisar" ? "#8b5cf6" : "var(--dim)";
                  return (
                    <div
                      key={lane.status}
                      className="min-w-[72vw] sm:min-w-0"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        padding: "14px 16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <p style={{ color: laneColor, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>{lane.status}</p>
                        <span style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "999px", padding: "2px 8px", fontSize: "11px", fontWeight: 700, color: lane.count > 0 ? "var(--text)" : "var(--dim)" }}>{lane.count}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {lane.jobs.length === 0 ? (
                          <div style={{ border: "1px dashed var(--border)", borderRadius: "8px", padding: "12px", textAlign: "center", color: "var(--dim)", fontSize: "12px" }}>
                            Vazio
                          </div>
                        ) : (
                          lane.jobs.map((job) => (
                            <div
                              key={`${lane.status}-${job.id}`}
                              style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px" }}
                            >
                              <button type="button" onClick={() => handleInspectTrackedJob(job)} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                                <p style={{ color: "var(--text)", fontSize: "12px", fontWeight: 600, lineHeight: 1.3, marginBottom: "2px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{job.title}</p>
                                <p style={{ color: "var(--dim)", fontSize: "11px" }}>{job.company}</p>
                              </button>
                              <div style={{ height: "2px", background: "var(--border)", borderRadius: "999px", overflow: "hidden", margin: "8px 0" }}>
                                <div style={{ height: "100%", width: `${Math.max(4, Math.min(job.score, 100))}%`, background: laneColor, borderRadius: "999px" }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={badgeStyle(job.score)}>{job.score}%</span>
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleInspectTrackedJob(job)}
                                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--dim)", borderRadius: "4px", padding: "2px 8px", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}
                                  >
                                    Abrir
                                  </button>
                                  {job.status !== "Entrevista" && (
                                    <button
                                      type="button"
                                      onClick={() => handleAdvanceTrackedJob(job.id)}
                                      style={{ background: "var(--gold)", color: "#020810", border: "none", borderRadius: "4px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                                      title="Avançar stage"
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right sidebar: analytics ─────────────────────────────────────── */}
          <div className="hidden xl:flex" style={{ flexDirection: "column", gap: "12px", position: "sticky", top: "70px" }}>

            {/* Pipeline analytics */}
            {analytics.totalJobs > 0 && (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "14px" }}>
                  Analytics
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                  {[
                    { label: "Apply rate", value: `${analytics.applyRate}%` },
                    { label: "Interview", value: `${analytics.interviewRate}%` },
                    { label: "Avg score", value: `${analytics.avgScore}%` },
                    { label: "Top score", value: `${analytics.topScore}%` },
                  ].map((k) => (
                    <div key={k.label} style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px" }}>
                      <p style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{k.label}</p>
                      <p style={{ color: "var(--text)", fontSize: "18px", fontWeight: 700, lineHeight: 1.2, marginTop: "2px" }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Score distribution */}
                {analytics.scoreBuckets.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <p style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>Score dist.</p>
                    {analytics.scoreBuckets.map((b) => (
                      <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                        <span style={{ color: "var(--muted)", fontSize: "10px", fontWeight: 600, width: "40px", flexShrink: 0 }}>{b.label}</span>
                        <div style={{ flex: 1, height: "4px", background: "var(--border)", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${analytics.totalJobs ? (b.count / analytics.totalJobs) * 100 : 0}%`, background: "#3b82f6", borderRadius: "999px" }} />
                        </div>
                        <span style={{ color: "var(--dim)", fontSize: "10px", width: "16px", textAlign: "right", flexShrink: 0 }}>{b.count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stalled / ready */}
                {analytics.stalledJobs.length > 0 && (
                  <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", borderRadius: "8px", padding: "10px 12px", marginBottom: "8px" }}>
                    <p style={{ color: "#f59e0b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>Stalled ({analytics.stalledJobs.length})</p>
                    {analytics.stalledJobs.slice(0, 2).map((j) => (
                      <p key={j.id} style={{ color: "var(--muted)", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>{j.title}</p>
                    ))}
                  </div>
                )}
                {analytics.readyToApply.length > 0 && (
                  <div style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: "8px", padding: "10px 12px" }}>
                    <p style={{ color: "#10b981", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>Ready ({analytics.readyToApply.length})</p>
                    {analytics.readyToApply.slice(0, 2).map((j) => (
                      <p key={j.id} style={{ color: "var(--muted)", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>{j.score}% · {j.title}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "12px" }}>
                Ações rápidas
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link href="/control-center" style={{ display: "block", background: "var(--gold)", color: "#020810", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, textAlign: "center" }}>
                  + Adicionar vaga
                </Link>
                <Link href="/jobs" style={{ display: "block", background: "var(--surf)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, textAlign: "center" }}>
                  Ver radar completo
                </Link>
                <Link href="/sources" style={{ display: "block", color: "var(--dim)", fontSize: "12px", padding: "4px 0", textAlign: "center" }}>
                  Gerenciar fontes →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CONTROL CENTER MODE ──────────────────────────────────────────────────────

  // Welcome screen — radar ainda carregando ou sem vagas reais
  if (!radarLoaded || !hasRealJobs) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>
        <div className="flex flex-col gap-4 xl:grid xl:items-start" style={{ gridTemplateColumns: "1fr 272px" }}>
          {/* Main column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Status */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "999px", padding: "5px 12px", fontSize: "12px", color: "var(--dim)", alignSelf: "flex-start" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: syncDotColor }} />
              {!radarLoaded ? t("sync.checking") : syncMessage}
            </div>

            {!radarLoaded ? (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "64px 20px", textAlign: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surf)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "var(--dim)", margin: "0 auto 16px" }}>◎</div>
                <p style={{ color: "var(--text)", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Carregando radar...</p>
                <p style={{ color: "var(--dim)", fontSize: "12px" }}>Verificando vagas persistidas</p>
              </div>
            ) : (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ borderBottom: "1px solid var(--border)", padding: "24px 28px" }}>
                  <p style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>Control Center</p>
                  <h2 style={{ color: "var(--text)", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "6px" }}>Radar vazio — adicione a primeira vaga</h2>
                  <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.6 }}>
                    Use discovery real para puxar vagas dos portais conectados, ou cole um JD manualmente para começar.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2">
                  <button type="button" onClick={() => setWorkspaceMode("discovery")} style={{ borderRight: "1px solid var(--border)", padding: "24px", textAlign: "left", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", border: "1px solid rgba(59,130,246,.3)", background: "rgba(59,130,246,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg style={{ width: "20px", height: "20px", color: "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    </div>
                    <div>
                      <p style={{ color: "var(--text)", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Discovery real</p>
                      <p style={{ color: "var(--dim)", fontSize: "12px", lineHeight: 1.5 }}>Puxe vagas diretamente dos portais Siemens, Rheinmetall e BWI.</p>
                    </div>
                    <span style={{ color: "#3b82f6", fontSize: "12px", fontWeight: 700 }}>Iniciar discovery →</span>
                  </button>
                  <button type="button" onClick={() => setWorkspaceMode("manual")} style={{ padding: "24px", textAlign: "left", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surf)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg style={{ width: "20px", height: "20px", color: "var(--muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                    </div>
                    <div>
                      <p style={{ color: "var(--text)", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Intake manual</p>
                      <p style={{ color: "var(--dim)", fontSize: "12px", lineHeight: 1.5 }}>Cole qualquer JD — o Argus estrutura, calcula match e salva no radar.</p>
                    </div>
                    <span style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 700 }}>Colar JD →</span>
                  </button>
                </div>
              </div>
            )}

            {/* Intake area */}
            {radarLoaded && renderIntakeArea()}
          </div>

          {/* Sidebar */}
          <div className="hidden xl:flex" style={{ flexDirection: "column", gap: "12px", position: "sticky", top: "70px" }}>
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" }}>
              <p style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "10px" }}>Perfil ativo</p>
              <p style={{ color: "var(--text)", fontSize: "14px", fontWeight: 600 }}>{activeProfile.name}</p>
              <p style={{ color: "var(--dim)", fontSize: "12px", marginTop: "2px", marginBottom: "12px" }}>{activeProfile.location} · {activeProfile.availability}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {activeProfile.coreStack.slice(0, 5).map((s) => (
                  <span key={s} style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--dim)", borderRadius: "4px", padding: "2px 7px", fontSize: "11px" }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" }}>
              <p style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "10px" }}>Sources live</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {sources.filter((s) => /live/i.test(s.status)).map((s) => (
                  <div key={s.company} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 10px" }}>
                    <p style={{ color: "var(--muted)", fontSize: "12px" }}>{s.company}</p>
                    <span style={{ background: "rgba(16,185,129,.15)", color: "#10b981", borderRadius: "999px", padding: "1px 8px", fontSize: "10px", fontWeight: 700 }}>live</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>
      <div className="flex flex-col gap-4 xl:grid xl:items-start" style={{ gridTemplateColumns: "1fr 272px" }}>
      {/* ── Main column ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Active job hero */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", color: "var(--text)" }}>
          {/* Top bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px", borderBottom: "1px solid var(--border)", padding: "10px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: syncDotColor, flexShrink: 0 }} />
              <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--dim)" }}>{syncMessage}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {activeTrackedJob && (
                <select
                  value={activeTrackedJob.status}
                  onChange={(e) => handleUpdateTrackedJobStatus(activeTrackedJob.id, e.target.value)}
                  style={{ borderRadius: "999px", border: "1px solid var(--border)", background: "var(--surf)", padding: "4px 12px", fontSize: "11px", fontWeight: 600, color: "var(--muted)", outline: "none", cursor: "pointer" }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} style={{ background: "var(--bg)", color: "var(--text)" }}>{s}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Hero content */}
          <div style={{ padding: "20px" }}>
            {/* Título + empresa */}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--gold)" }}>Vaga ativa</p>
              <h1 style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.02em", wordBreak: "break-word", color: "var(--text)" }}>
                {parsedJob.title}
              </h1>
              <p style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px", fontSize: "12px", color: "var(--dim)" }}>
                {parsedJob.company && <span style={{ fontWeight: 500, color: "var(--muted)" }}>{parsedJob.company}</span>}
                {parsedJob.company && <span>·</span>}
                <span>{parsedJob.location}</span>
                {parsedJob.seniority && parsedJob.seniority !== "Not specified" && (
                  <><span>·</span><span>{parsedJob.seniority}</span></>
                )}
                {parsedJob.workModel && parsedJob.workModel !== "Not specified" && (
                  <><span>·</span><span>{parsedJob.workModel}</span></>
                )}
              </p>
            </div>

            {/* Score + match bar */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={badgeStyle(analysis.score)}>{analysis.score}%</span>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--dim)" }}>{analysis.verdict}</span>
                </div>
                {activeTrackedJob && (
                  <span style={statusStyle(activeTrackedJob.status)}>{activeTrackedJob.status}</span>
                )}
              </div>
              <div style={{ marginTop: "10px", height: "4px", background: "var(--border)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "999px", background: analysis.score >= 78 ? "#10b981" : analysis.score >= 60 ? "#f59e0b" : "#ef4444", transition: "width .3s", width: matchMeterWidth }} />
              </div>
            </div>

            {/* Strengths + gaps */}
            {(analysis.strengths.length > 0 || analysis.risks.length > 0) && (
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {analysis.strengths.slice(0, 2).map((s) => (
                  <p key={s} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "12px", color: "#10b981" }}>
                    <span style={{ marginTop: "1px", flexShrink: 0 }}>✓</span>
                    <span>{s}</span>
                  </p>
                ))}
                {analysis.risks.slice(0, 1).map((r) => (
                  <p key={r} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "12px", color: "#f59e0b" }}>
                    <span style={{ marginTop: "1px", flexShrink: 0 }}>⚠</span>
                    <span>{r}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Follow-up alert */}
            {followUpUrgency(activeTrackedJob) === "overdue" && (
              <div style={{ marginTop: "12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "8px", padding: "8px 12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#ef4444" }}>
                  {daysSince(activeTrackedJob.updatedAt)}d sem resposta — fazer follow up
                </p>
              </div>
            )}
            {followUpUrgency(activeTrackedJob) === "due-soon" && (
              <div style={{ marginTop: "12px", background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.25)", borderRadius: "8px", padding: "8px 12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b" }}>
                  {daysSince(activeTrackedJob.updatedAt)}d aplicado — considerar follow up
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(activeTrackedJob?.sourceUrl ?? activeDiscovery?.listing.sourceUrl) ? (
                <a
                  href={activeTrackedJob?.sourceUrl ?? activeDiscovery?.listing.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: "var(--gold)", color: "#020810", borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: 700 }}
                >
                  Aplicar na vaga ↗
                </a>
              ) : (
                <span style={{ border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", color: "var(--dim)" }}>
                  ⚠ Vaga sem link de origem
                </span>
              )}
              <button type="button" onClick={handleCopyRecruiterMessage} style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, color: "var(--muted)", cursor: "pointer" }}>
                {copiedState === "copied" ? t("cc.messageCopied") : t("cc.copyMessage")}
              </button>
              {activeTrackedJob && (
                <button type="button" onClick={() => handleAdvanceTrackedJob(activeTrackedJob.id)} style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, color: "var(--muted)", cursor: "pointer" }}>
                  Avançar stage →
                </button>
              )}
              {activeTrackedJob && (
                <button
                  type="button"
                  onClick={() => {
                    const pkg = buildCandidacyPackage(activeTrackedJob, activeProfile, messageLang);
                    downloadCandidacyPackage(pkg);
                    setExportState("done");
                    setTimeout(() => setExportState("idle"), 2000);
                  }}
                  style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, color: exportState === "done" ? "#10b981" : "var(--dim)", cursor: "pointer" }}
                >
                  {exportState === "done" ? "✓ Package ready" : "Export package ↓"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Panel tabs */}
        <div style={{ display: "flex", gap: "2px", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "10px", padding: "3px", overflowX: "auto", scrollbarWidth: "none" }}>
          {([
            { id: "summary", label: t("cc.tabSummary"), hint: parsedJob.title ? "✓" : "" },
            { id: "match",   label: t("cc.tabMatch"),   hint: `${analysis.score}%` },
            { id: "gap",     label: t("cc.tabGap"),     hint: gapAnalysis ? (gapAnalysis.missingSkills.filter(s=>s.severity==="critical").length > 0 ? `${gapAnalysis.missingSkills.filter(s=>s.severity==="critical").length}⚠` : "✓") : "" },
            { id: "message", label: t("cc.tabMessage"), hint: recruiterMessage ? "✓" : "" },
            { id: "history", label: t("cc.tabHistory"), hint: activeTrackedJob?.history.length ? `${activeTrackedJob.history.length}` : "" },
            ...(activeTrackedJob?.status === "Entrevista" ? [{ id: "interview" as ActivePanel, label: "Interview", hint: "★" }] : []),
          ] as { id: ActivePanel; label: string; hint: string }[]).map((panel) => (
            <button
              key={panel.id}
              type="button"
              onClick={() => setActivePanel(panel.id)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                borderRadius: "8px", padding: "8px 4px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                border: "none", transition: "all .15s",
                background: activePanel === panel.id ? "var(--card)" : "transparent",
                color: activePanel === panel.id ? "var(--gold)" : "var(--dim)",
              }}
            >
              {panel.label}
              {panel.hint && (
                <span style={{
                  borderRadius: "999px", padding: "1px 6px", fontSize: "9px", fontWeight: 700,
                  background: activePanel === panel.id ? "rgba(245,158,11,.15)" : "var(--border)",
                  color: activePanel === panel.id ? "var(--gold)" : "var(--dim)",
                }}>
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
              <div style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--gold)", marginBottom: "12px" }}>Role brief</p>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{parsedJob.title}</h3>
                <p style={{ fontSize: "12px", color: "var(--dim)", marginBottom: "14px" }}>{parsedJob.company} · {parsedJob.location}</p>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)", marginBottom: "14px" }}>{parsedJob.summary}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {parsedJob.skills.slice(0, 6).map((skill) => (
                    <a
                      key={skill}
                      href={`/jobs?q=${encodeURIComponent(skill)}`}
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--dim)", borderRadius: "4px", padding: "2px 8px", fontSize: "11px" }}
                      title={`Buscar vagas com ${skill}`}
                    >
                      {skill}
                    </a>
                  ))}
                </div>
              </div>
              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { l: "Senioridade", v: parsedJob.seniority },
                  { l: "Modelo", v: parsedJob.workModel },
                  { l: "Contrato", v: parsedJob.employmentType },
                  { l: "Idiomas", v: parsedJob.languages.join(", ") || "Não detectados" },
                ].map((item) => (
                  <div key={item.l} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
                    <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--dim)" }}>{item.l}</p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginTop: "4px" }}>{item.v || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          

          {activePanel === "message" && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--dim)" }}>Recruiter message</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "2px", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "999px", padding: "2px" }}>
                    {(["en", "de", "pt"] as const).map((lang) => (
                      <button key={lang} type="button" onClick={() => setMessageLang(lang)} style={{
                        borderRadius: "999px", padding: "3px 10px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", cursor: "pointer", border: "none",
                        background: messageLang === lang ? "var(--gold)" : "transparent", color: messageLang === lang ? "#020810" : "var(--dim)",
                      }}>
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={handleCopyRecruiterMessage} style={{ background: "var(--gold)", color: "#020810", borderRadius: "6px", padding: "4px 14px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}>
                    {copiedState === "copied" ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", fontSize: "13px", lineHeight: 1.6, color: "var(--muted)", fontFamily: "inherit" }}>
                {recruiterMessage}
              </pre>
              <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--dim)" }}>Cover paragraph</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "2px", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "999px", padding: "2px" }}>
                      {(["en", "de", "pt"] as const).map((lang) => (
                        <button key={lang} type="button" onClick={() => setCoverLang(lang)} style={{
                          borderRadius: "999px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", cursor: "pointer", border: "none",
                          background: coverLang === lang ? "var(--gold)" : "transparent", color: coverLang === lang ? "#020810" : "var(--dim)",
                        }}>
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={async () => { await navigator.clipboard.writeText(customCover); setCoverCopied(true); setTimeout(() => setCoverCopied(false), 1800); }}
                      style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, color: "var(--muted)", cursor: "pointer" }}>
                      {coverCopied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <p style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
                  {customCover}
                </p>
              </div>
            </div>
          )}

          {activePanel === "history" && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--dim)", marginBottom: "12px" }}>
                Histórico de status
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {activeTimeline.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--dim)" }}>Sem histórico ainda.</p>
                ) : (
                  activeTimeline.map((entry, i) => (
                    <div key={`${entry.status}-${entry.changedAt}-${i}`} style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: statusStyle(entry.status).color ?? "#94a3b8" }} />
                      <p style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{entry.status}</p>
                      <p style={{ fontSize: "11px", color: "var(--dim)" }}>{formatActivityLabel(entry.changedAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

          {activePanel === "interview" && interviewPrep && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.2)", borderRadius: "12px", padding: "16px 20px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#3b82f6", marginBottom: "10px" }}>Key talking points</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {interviewPrep.talkingPoints.map((pt, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--muted)" }}>
                      <span style={{ marginTop: "1px", flexShrink: 0, color: "#3b82f6" }}>→</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--dim)", marginBottom: "12px" }}>Likely questions</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {interviewPrep.questions.slice(0, 6).map((q, i) => (
                    <div key={i} style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ background: q.category === "technical" ? "rgba(59,130,246,.15)" : q.category === "behavioral" ? "rgba(16,185,129,.15)" : "rgba(139,92,246,.15)", color: q.category === "technical" ? "#3b82f6" : q.category === "behavioral" ? "#10b981" : "#8b5cf6", borderRadius: "999px", padding: "2px 8px", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", flexShrink: 0, marginTop: "2px" }}>
                          {q.category}
                        </span>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{q.question}</p>
                      </div>
                      <p style={{ marginTop: "6px", fontSize: "12px", lineHeight: 1.5, color: "var(--dim)" }}>{q.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--dim)", marginBottom: "10px" }}>Research checklist</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {interviewPrep.researchChecklist.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                      <span style={{ marginTop: "1px", flexShrink: 0, color: "var(--dim)" }}>☐</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              {interviewPrep.redFlags.length > 0 && (
                <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", borderRadius: "12px", padding: "16px 20px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#f59e0b", marginBottom: "10px" }}>Ask the interviewer</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {interviewPrep.redFlags.map((flag, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                        <span style={{ marginTop: "1px", flexShrink: 0, color: "#f59e0b" }}>?</span>
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Intake area */}
        {renderIntakeArea()}
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="space-y-4 xl:sticky xl:top-[68px]" style={{order: 2}}>
        {/* Radar list */}
        <div className="overflow-hidden rounded-[24px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>Radar</p>
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(148,163,184,.1)", color: "var(--muted)", border: "1px solid var(--border)" }}>{trackedJobs.length}</span>
              {trackedJobs.filter(j => j.status === "Nova").length > 0 && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(59,130,246,.2)", color: "#60a5fa" }}>
                  {trackedJobs.filter(j => j.status === "Nova").length} new
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {(["all", "priority"] as ("all" | "priority")[]).map((f) => {
                const isActive = f === "priority" ? radarFilter === "priority" : radarFilter === "all";
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setRadarFilter(f === "priority" ? "priority" : "all")}
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold transition"
                    style={isActive
                      ? { background: "var(--gold)", color: "#000" }
                      : { color: "var(--muted)" }
                    }
                  >
                    {f === "all" ? "Todos" : "≥70%"}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto" style={{ borderColor: "var(--border)" }}>
            {filteredTrackedJobs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                <p className="text-[12px]" style={{ color: "var(--dim)" }}>
                  {radarFilter === "priority" ? "Nenhuma vaga com score ≥ 70%" : "Radar vazio"}
                </p>
                {radarFilter === "priority" && (
                  <button
                    type="button"
                    onClick={() => setRadarFilter("all")}
                    className="text-[11px] font-semibold"
                    style={{ color: "var(--gold)" }}
                  >
                    Ver todas
                  </button>
                )}
              </div>
            ) : (
              filteredTrackedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  onClick={() => handleInspectTrackedJob(job)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition"
                  style={activeTrackedJobId === job.id
                    ? { background: "rgba(245,158,11,.08)", boxShadow: "inset 3px 0 0 var(--gold)", borderBottom: "1px solid var(--border)" }
                    : { borderBottom: "1px solid var(--border)" }
                  }
                >
                  <span style={badgeStyle(job.score)} className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {job.score}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold" style={{ color: "var(--text)" }}>{job.title}</p>
                    <p className="text-[11px]" style={{ color: "var(--muted)" }}>{job.company}</p>
                  </div>
                  <span style={statusStyle(job.status)} className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                    {job.status.split(" ")[0]}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Profile sync */}
        <div className="rounded-[24px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {/* Header com status */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>CV & Cover Letter</p>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={
                profileSyncState === "synced" ? { background: "rgba(16,185,129,.15)", color: "#10b981" } :
                profileSyncState === "syncing" ? { background: "rgba(59,130,246,.15)", color: "#60a5fa" } :
                profileSyncState === "error" ? { background: "rgba(239,68,68,.15)", color: "#ef4444" } :
                { background: "rgba(148,163,184,.1)", color: "var(--muted)" }
              }
            >
              {profileSyncState === "synced" ? "✓ Sincronizado" :
               profileSyncState === "syncing" ? "Salvando..." :
               profileSyncState === "error" ? "Erro ao salvar" :
               profileSyncState === "offline" ? "Local" : "Verificando..."}
            </span>
          </div>

          {/* Info contextual */}
          <p className="mb-3 text-[11px] leading-5" style={{ color: "var(--dim)" }}>
            Atualizar o CV e a cover letter recalcula o match de todas as vagas automaticamente.
          </p>

          <div className="space-y-2.5">
            <div className="block">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>CV</span>
                <label className="cursor-pointer">
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition" style={{ background: "transparent", color: "var(--gold)", border: "1px solid rgba(245,158,11,.3)" }}>
                    {cvUploadState === "uploading" ? "Lendo..." : "Subir arquivo ↑"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    className="hidden"
                    disabled={cvUploadState === "uploading"}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setCvUploadState("uploading");
                      setCvUploadMsg("Extraindo texto...");
                      try {
                        const fd = new FormData();
                        fd.append("cv", file);
                        const res = await fetch("/api/profile/upload-cv", { method: "POST", body: fd });
                        const payload = await res.json() as { text?: string; error?: string; charCount?: number };
                        if (!res.ok || !payload.text) {
                          setCvUploadState("error");
                          setCvUploadMsg(payload.error ?? "Falha ao extrair texto");
                        } else {
                          setCvText(payload.text);
                          setCvUploadState("done");
                          setCvUploadMsg(`✓ ${payload.charCount?.toLocaleString()} chars extraídos — revisando...`);
                          setTimeout(() => setCvUploadState("idle"), 4000);
                        }
                      } catch {
                        setCvUploadState("error");
                        setCvUploadMsg("Falha no upload");
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {cvUploadMsg && (
                <p className={["mb-1 text-[10px]", cvUploadState === "error" ? "text-rose-500" : "text-emerald-600"].join(" ")}>
                  {cvUploadMsg}
                </p>
              )}
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                className="min-h-[110px] w-full rounded-xl px-3 py-2.5 text-[12px] leading-5 outline-none transition"
                style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--text)" }}
                placeholder="Cole o texto completo do seu CV ou use 'Subir arquivo' acima..."
              />
            </div>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>Cover letter</span>
              <textarea
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                className="mt-1 min-h-[80px] w-full rounded-xl px-3 py-2.5 text-[12px] leading-5 outline-none transition"
                style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--text)" }}
                placeholder="Cole o parágrafo base da sua cover letter..."
              />
            </label>
          </div>

          {/* Save manual + feedback */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setProfileSyncState("syncing");
                void fetch("/api/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cvText, coverLetterText }),
                }).then(async (r) => {
                  if (r.ok) {
                    setProfileSyncState("synced");
                    setProfileSyncMessage("Perfil salvo manualmente.");
                  } else {
                    setProfileSyncState("error");
                    setProfileSyncMessage("Erro ao salvar.");
                  }
                }).catch(() => {
                  setProfileSyncState("error");
                  setProfileSyncMessage("Falha na conexão.");
                });
              }}
              className="rounded-full px-3 py-1 text-[11px] font-semibold transition"
              style={{ background: "transparent", color: "var(--gold)", border: "1px solid rgba(245,158,11,.3)" }}
            >
              Salvar agora
            </button>
            {profileSyncState !== "checking" && (
              <p className="text-[10px]" style={{ color: "var(--dim)" }}>{profileSyncMessage}</p>
            )}
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}
