"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function navClass(active: boolean) {
  return active
    ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition hover:bg-slate-100"
    : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10";
}

export function AppHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const isJobsRoute = pathname === "/jobs" || pathname.startsWith("/jobs/");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-900/75 bg-[rgba(5,12,25,0.88)] text-white backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-6 py-4 lg:px-10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#ffffff,#dbeafe)] text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.28)]"
            >
              A
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
                  Argus Dashboard
                </p>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  Private radar
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Discovery, match e operacao de candidatura em um painel unico
              </p>
            </div>
          </div>

          <form
            action="/jobs"
            className="flex w-full max-w-3xl items-center gap-2 rounded-[26px] border border-white/10 bg-white/5 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <input
              key={`${pathname}-${currentQuery}`}
              name="q"
              defaultValue={currentQuery}
              placeholder="Buscar vagas, empresas, local ou stack..."
              className="h-11 w-full rounded-[18px] bg-transparent px-4 text-sm text-white outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#38bdf8,#f97316)] px-5 text-sm font-semibold text-slate-950 transition hover:brightness-105"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <nav className="flex flex-wrap items-center gap-2">
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
          </nav>

          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Daily radar
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Match engine
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Recruiter draft
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
