"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/lib/i18n/context";
import { statusToDisplay } from "@/lib/radar-types";
import type { TrackedJob } from "@/lib/radar-types";

const STORAGE_KEY = "argus-workbench-state";
const MAX_RESULTS = 8;

/** Pages & sections searchable beyond jobs */
const PAGES = [
  { href: "/jobs",           keys: ["nav.jobs", "jobs.title"] },
  { href: "/dashboard",      keys: ["nav.dashboard", "dashboard.title"] },
  { href: "/control-center", keys: ["nav.controlCenter", "cc.title"] },
  { href: "/sources",        keys: ["nav.sources", "sources.title"] },
  { href: "/digests",        keys: ["nav.digests", "digests.title"] },
  { href: "/ops",            keys: ["nav.ops", "ops.title"] },
  { href: "/profile",        keys: ["home.profile"] },
] as const;

type SearchResult = {
  type: "job" | "page";
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  score?: number;
  status?: string;
};

export function OmniSearch() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load jobs from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.trackedJobs?.length) {
        setJobs(parsed.trackedJobs);
      }
    } catch { /* ignore */ }
  }, [open]); // re-read when opened

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIdx(0);
    }
  }, [open]);

  const normalize = useCallback((s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), []);

  const results = useMemo<SearchResult[]>(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    const out: SearchResult[] = [];

    // Search jobs — bilingual: match title, company, location, status display
    for (const job of jobs) {
      const statusDisplay = statusToDisplay(job.status, t);
      const searchable = normalize(
        [job.title, job.company, job.location, job.status, statusDisplay, job.seniority, job.workModel]
          .filter(Boolean)
          .join(" ")
      );
      if (searchable.includes(q)) {
        out.push({
          type: "job",
          id: job.id,
          href: `/jobs/${job.id}`,
          title: job.title,
          subtitle: `${job.company}${job.location ? ` · ${job.location}` : ""}`,
          score: job.score,
          status: statusDisplay,
        });
      }
      if (out.length >= MAX_RESULTS) break;
    }

    // Search pages
    if (out.length < MAX_RESULTS) {
      for (const page of PAGES) {
        const searchable = normalize(page.keys.map((k) => t(k)).join(" ") + " " + page.href);
        if (searchable.includes(q)) {
          out.push({
            type: "page",
            id: page.href,
            href: page.href,
            title: t(page.keys[0]),
            subtitle: t(page.keys[1] ?? page.keys[0]),
          });
        }
      }
    }

    return out;
  }, [query, jobs, t, normalize]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIdx]) {
        e.preventDefault();
        setOpen(false);
        window.location.href = results[selectedIdx].href;
      }
    },
    [results, selectedIdx]
  );

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--dim)",
          borderRadius: "6px",
          padding: "5px 9px",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
        }}
        title={`${t("nav.search")} (⌘K)`}
      >
        <svg style={{ width: "14px", height: "14px" }} fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2.5}>
          <circle cx="7" cy="7" r="5" />
          <path d="M11 11l3 3" strokeLinecap="round" />
        </svg>
        <span className="hidden xl:inline" style={{ fontSize: "11px", color: "var(--dim)", opacity: 0.5 }}>⌘K</span>
      </button>

      {/* Dropdown overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,.5)",
            zIndex: 100,
            display: "flex",
            justifyContent: "center",
            paddingTop: "min(20vh, 120px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 25px 50px rgba(0,0,0,.4)",
              maxHeight: "420px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <svg style={{ width: "16px", height: "16px", color: "var(--dim)", flexShrink: 0 }} fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <circle cx="7" cy="7" r="5" />
                <path d="M11 11l3 3" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder={t("nav.search")}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text)",
                  fontSize: "14px",
                }}
              />
              <kbd style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", color: "var(--dim)" }}>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {query.trim() && results.length === 0 && (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--dim)", fontSize: "13px" }}>
                  {t("global.noResults")}
                </div>
              )}
              {results.map((r, i) => (
                <Link
                  key={r.id}
                  href={r.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 16px",
                    textDecoration: "none",
                    background: i === selectedIdx ? "rgba(245,158,11,.08)" : "transparent",
                    borderLeft: i === selectedIdx ? "2px solid var(--gold)" : "2px solid transparent",
                    transition: "background .1s",
                  }}
                  onMouseEnter={() => setSelectedIdx(i)}
                >
                  {/* Icon */}
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: r.type === "job" ? "rgba(59,130,246,.1)" : "rgba(148,163,184,.08)",
                    border: `1px solid ${r.type === "job" ? "rgba(59,130,246,.2)" : "var(--border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    color: r.type === "job" ? "#60a5fa" : "var(--dim)",
                    flexShrink: 0,
                  }}>
                    {r.type === "job" ? "◉" : "→"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.title}
                    </p>
                    {r.subtitle && (
                      <p style={{ color: "var(--dim)", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Score badge for jobs */}
                  {r.score != null && (
                    <span style={{
                      background: r.score >= 78 ? "rgba(16,185,129,.15)" : r.score >= 60 ? "rgba(245,158,11,.15)" : "rgba(239,68,68,.15)",
                      color: r.score >= 78 ? "#10b981" : r.score >= 60 ? "#f59e0b" : "#ef4444",
                      borderRadius: "999px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {r.score}%
                    </span>
                  )}

                  {/* Status for jobs */}
                  {r.status && (
                    <span style={{ color: "var(--dim)", fontSize: "10px", flexShrink: 0 }}>
                      {r.status}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Footer hint */}
            <div style={{ borderTop: "1px solid var(--border)", padding: "8px 16px", display: "flex", gap: "12px", fontSize: "10px", color: "var(--dim)" }}>
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
