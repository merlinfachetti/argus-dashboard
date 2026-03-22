"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
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
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header
      style={{ backgroundColor: "#0a0f1e", borderBottom: "1px solid #1e293b" }}
      className="sticky top-0 z-40"
    >
      <div className="mx-auto flex w-full max-w-[92rem] items-center gap-4 px-6 lg:px-10">

        {/* Logo */}
        <Link
          href="/"
          style={{ borderRight: "1px solid #1e293b" }}
          className="flex h-[52px] shrink-0 items-center gap-2.5 pr-4"
        >
          <span
            style={{ background: "linear-gradient(135deg, #e2e8f0, #bae6fd, #7dd3fc)" }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-slate-900"
          >
            A
          </span>
          <span style={{ color: "#f8fafc" }} className="text-[13px] font-semibold">
            Argus
          </span>
          <span
            style={{ background: "#0c4a6e", color: "#38bdf8" }}
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]"
          >
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
                  style={{
                    color: active ? "#f8fafc" : "#94a3b8",
                  }}
                  className={[
                    "relative flex h-[52px] items-center px-3 text-[13px] transition-all",
                    active ? "font-semibold" : "font-medium hover:!text-white",
                  ].join(" ")}
                >
                  {item.label}
                  {active && (
                    <span
                      style={{ background: "#38bdf8" }}
                      className="absolute inset-x-3 bottom-0 h-[2px] rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Search */}
        {!isLoginRoute && (
          <form
            action="/jobs"
            style={{ background: "#0f172a", border: "1px solid #334155" }}
            className="ml-auto flex h-8 w-full max-w-[220px] items-center gap-2 rounded-full px-3 transition-all focus-within:border-sky-600"
          >
            <svg
              style={{ color: "#64748b" }}
              className="h-3 w-3 shrink-0"
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
              style={{ color: "#f1f5f9", background: "transparent" }}
              className="h-full w-full text-[12px] outline-none placeholder:text-slate-500"
            />
          </form>
        )}

        {/* Logout */}
        {!isLoginRoute && (
          <button
            type="button"
            onClick={() => void handleLogout()}
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              color: "#cbd5e1",
            }}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition hover:!bg-slate-700 hover:!text-white"
          >
            Sair
          </button>
        )}

      </div>
    </header>
  );
}
