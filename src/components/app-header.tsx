"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function navClass(active: boolean) {
  return active
    ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
    : "rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900";
}

export function AppHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[rgba(15,23,42,0.92)] text-white backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-6 py-4 lg:px-10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.28)]"
            >
              A
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
                Argus Dashboard
              </p>
              <p className="text-sm text-slate-300">
                Radar privado para discovery, match e operacao de candidatura
              </p>
            </div>
          </div>

          <form
            action="/jobs"
            className="flex w-full max-w-2xl items-center gap-2 rounded-[24px] border border-slate-700 bg-slate-900/70 p-2"
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
              className="inline-flex h-11 items-center justify-center rounded-[18px] bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Buscar
            </button>
          </form>
        </div>

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
          <Link href="/jobs" className={navClass(pathname === "/jobs")}>
            Jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}
