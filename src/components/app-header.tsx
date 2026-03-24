"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LangSwitcher } from "@/components/lang-switcher";
import { useT } from "@/lib/i18n/context";

export function AppHeader() {
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const currentQuery  = searchParams.get("q") ?? "";
  const isLoginRoute  = pathname === "/login";
  const isJobsRoute   = pathname === "/jobs" || pathname.startsWith("/jobs/");
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();

  const NAV_ITEMS = [
    { href: "/control-center", label: t("nav.controlCenter") },
    { href: "/dashboard",      label: t("nav.dashboard") },
    { href: "/jobs",           label: t("nav.jobs") },
    { href: "/digests",        label: t("nav.digests") },
    { href: "/sources",        label: t("nav.sources") },
    { href: "/ops",            label: t("nav.ops") },
  ] as const;

  function isActive(href: string) {
    if (href === "/jobs") return isJobsRoute;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <>
      <header
        style={{ backgroundColor: "#0a0f1e", borderBottom: "1px solid #1e293b" }}
        className="sticky top-0 z-40"
      >
        <div className="mx-auto flex h-[64px] w-full max-w-[92rem] items-center gap-3 px-4 sm:px-6 lg:px-10">

          {/* Logo */}
          <Link
            href="/"
            style={{ borderRight: "1px solid #1e293b" }}
            className="flex h-[64px] shrink-0 items-center gap-3 pr-4 sm:pr-5"
          >
            <Image
              src="/logo-argus.png"
              alt="Argus"
              width={56}
              height={56}
              className="h-14 w-14 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
              priority
            />
            <div className="hidden flex-col sm:flex">
              <span style={{ color: "#f8fafc" }} className="text-[15px] font-bold leading-none tracking-tight">
                Argus
              </span>
              <span style={{ color: "#475569" }} className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                Job Radar
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          {!isLoginRoute && (
            <nav className="hidden items-center lg:flex">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ color: active ? "#f8fafc" : "#94a3b8" }}
                    className={[
                      "relative flex h-[48px] items-center px-3 text-[13px] transition-colors hover:!text-white",
                      active ? "font-semibold" : "font-medium",
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
              className="ml-auto flex h-8 w-full max-w-[160px] items-center gap-2 rounded-full px-3 transition-all focus-within:border-sky-600 sm:max-w-[200px]"
            >
              <svg style={{ color: "#64748b" }} className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" strokeLinecap="round" />
              </svg>
              <input
                key={`${pathname}-${currentQuery}`}
                name="q"
                defaultValue={currentQuery}
                placeholder={t("nav.search")}
                style={{ color: "#f1f5f9", background: "transparent" }}
                className="h-full w-full text-[12px] outline-none placeholder:text-slate-500"
              />
            </form>
          )}

          {/* Lang switcher */}
          {!isLoginRoute && <LangSwitcher />}

          {/* Desktop logout */}
          {!isLoginRoute && (
            <button
              type="button"
              onClick={() => void handleLogout()}
              style={{ background: "#0f172a", border: "1px solid #334155", color: "#94a3b8" }}
              className="hidden shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition hover:!bg-slate-700 hover:!text-white lg:block"
            >
              {t("nav.logout")}
            </button>
          )}

          {/* Mobile menu button */}
          {!isLoginRoute && (
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              style={{ color: "#94a3b8" }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:!text-white lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      {!isLoginRoute && mobileOpen && (
        <div
          style={{ backgroundColor: "#0a0f1e", borderBottom: "1px solid #1e293b" }}
          className="sticky top-[48px] z-30 lg:hidden"
        >
          <nav className="mx-auto flex max-w-[92rem] flex-col px-4 py-2 sm:px-6">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    color: active ? "#f8fafc" : "#94a3b8",
                    borderLeft: active ? "2px solid #38bdf8" : "2px solid transparent",
                  }}
                  className="flex items-center gap-3 px-3 py-3 text-[14px] font-medium transition hover:!text-white"
                >
                  {item.label}
                </Link>
              );
            })}
            <div style={{ borderTop: "1px solid #1e293b" }} className="mt-2 pt-2 pb-1">
              <button
                type="button"
                onClick={() => void handleLogout()}
                style={{ color: "#64748b" }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition hover:!text-white"
              >
                {t("nav.logout")}
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
