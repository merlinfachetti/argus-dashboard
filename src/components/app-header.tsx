"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function navClass(active: boolean) {
  return active
    ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition hover:bg-slate-100"
    : "rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.12]";
}

export function AppHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const isJobsRoute = pathname === "/jobs" || pathname.startsWith("/jobs/");
  const isSourcesRoute = pathname === "/sources";
  const isDigestsRoute = pathname === "/digests";
  const isOpsRoute = pathname === "/ops";
  const isLoginRoute = pathname === "/login";

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-950/80 bg-[linear-gradient(180deg,rgba(4,10,22,0.96),rgba(7,16,30,0.92))] text-white shadow-[0_18px_45px_rgba(8,17,31,0.22)] backdrop-blur-2xl">
      {!isLoginRoute ? (
        <div className="border-b border-white/8 bg-[linear-gradient(90deg,rgba(56,189,248,0.18),rgba(249,115,22,0.12),rgba(255,255,255,0.04))]">
          <div className="mx-auto flex w-full max-w-[92rem] flex-wrap items-center justify-between gap-3 px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200 lg:px-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1">
                Private opportunity intelligence
              </span>
              <span className="text-sky-200">Search</span>
              <span className="text-slate-400">Match</span>
              <span className="text-slate-400">Operate</span>
              <span className="text-slate-400">Digest</span>
            </div>
            <span className="text-slate-300">Argus mission control</span>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-5 px-6 py-4 lg:px-10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(135deg,#f8fafc,#e0f2fe_45%,#fed7aa)] text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.28)]"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_54%)]" />
              A
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
                  Argus Intelligence
                </p>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  Premium private radar
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Discovery, triage, decision e candidatura com contexto de verdade
              </p>
            </div>
          </div>

          {!isLoginRoute ? (
            <form
              action="/jobs"
              className="flex w-full max-w-3xl items-center gap-2 rounded-[30px] border border-white/10 bg-white/[0.07] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_40px_rgba(8,17,31,0.20)]"
            >
              <div className="flex h-11 items-center rounded-[18px] bg-white/[0.06] px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200">
                Search
              </div>
              <input
                key={`${pathname}-${currentQuery}`}
                name="q"
                defaultValue={currentQuery}
                placeholder="Buscar vagas, empresas, localização, stack ou senioridade..."
                className="h-11 w-full rounded-[18px] bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#38bdf8,#f97316)] px-5 text-sm font-semibold text-slate-950 transition hover:brightness-105"
              >
                Buscar
              </button>
            </form>
          ) : null}
        </div>

        {!isLoginRoute ? (
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <nav className="flex flex-wrap items-center gap-2 rounded-[24px] border border-white/10 bg-white/[0.04] p-2">
              <Link href="/" className={navClass(pathname === "/")}>
                Home
              </Link>
              <Link
                href="/control-center"
                className={navClass(pathname === "/control-center")}
              >
                Control Center
              </Link>
              <Link href="/dashboard" className={navClass(pathname === "/dashboard")}>
                Dashboard
              </Link>
              <Link href="/jobs" className={navClass(isJobsRoute)}>
                Jobs
              </Link>
              <Link href="/digests" className={navClass(isDigestsRoute)}>
                Digests
              </Link>
              <Link href="/sources" className={navClass(isSourcesRoute)}>
                Sources
              </Link>
              <Link href="/ops" className={navClass(isOpsRoute)}>
                Ops
              </Link>
            </nav>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">
                Daily radar
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">
                Match engine
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">
                Recruiter draft
              </span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-slate-100 transition hover:border-white/20 hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
