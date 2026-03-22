"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_ITEMS = [
  { href: "/control-center", label: "Control Center" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/digests", label: "Digests" },
  { href: "/sources", label: "Sources" },
  { href: "/ops", label: "Ops" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const isLoginRoute = pathname === "/login";
  const isJobsRoute = pathname === "/jobs" || pathname.startsWith("/jobs/");

  function isActive(href: string) {
    if (href === "/jobs") return isJobsRoute;
    return pathname === href;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    /* BG sólido — sem opacidade que vaza o fundo claro */
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex w-full max-w-[92rem] items-center gap-5 px-6 lg:px-10">

        {/* Logo + Brand */}
        <Link
          href="/"
          className="flex h-[52px] shrink-0 items-center gap-3 border-r border-slate-800 pr-5"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 via-sky-100 to-sky-200 text-[11px] font-bold text-slate-900">
            A
          </span>
          <span className="text-[13px] font-semibold text-white">
            Argus
          </span>
          <span className="rounded-full bg-sky-900/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-sky-400">
            v2
          </span>
        </Link>

        {/* Nav */}
        {!isLoginRoute && (
          <nav className="flex items-center">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "relative flex h-[52px] items-center px-3.5 text-[13px] transition-colors",
                    active
                      ? "font-semibold text-white after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-sky-400"
                      : "font-medium text-slate-400 hover:text-slate-100",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Search */}
        {!isLoginRoute && (
          <form
            action="/jobs"
            className="ml-auto flex h-8 w-full max-w-[240px] items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 transition-all focus-within:border-sky-600 focus-within:bg-slate-800"
          >
            <svg
              className="h-3 w-3 shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3 3" strokeLinecap="round" />
            </svg>
            <input
              key={`${pathname}-${currentQuery}`}
              name="q"
              defaultValue={currentQuery}
              placeholder="Buscar vagas..."
              className="h-full w-full bg-transparent text-[12px] text-slate-100 outline-none placeholder:text-slate-500"
            />
          </form>
        )}

        {/* Logout */}
        {!isLoginRoute && (
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            Sair
          </button>
        )}

      </div>
    </header>
  );
}
