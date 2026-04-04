"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { OmniSearch } from "@/components/omni-search";

const NAV_ITEMS = [
  { href: "/jobs",           labelKey: "Jobs" },
  { href: "/dashboard",      labelKey: "Dashboard" },
  { href: "/control-center", labelKey: "Control Center" },
  { href: "/sources",        labelKey: "Sources" },
  { href: "/digests",        labelKey: "Digests" },
  { href: "/ops",            labelKey: "Ops" },
] as const;

export function AppHeader() {
  const pathname      = usePathname();
  const isLoginRoute  = pathname === "/login";
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang } = useI18n();

  function isActive(href: string) {
    if (href === "/jobs") return pathname === "/jobs" || pathname.startsWith("/jobs/");
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (isLoginRoute) return null;

  return (
    <>
      {/* ── Desktop header ──────────────────────────────────────────────────── */}
      <header
        style={{
          backgroundColor: "var(--surf)",
          borderBottom: "1px solid var(--border)",
          height: "54px",
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 0,
        }}
      >
        {/* Logo — fixed left */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "152px",
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          <Image
            src="/logo-argus.png"
            alt="Argus"
            width={44}
            height={44}
            style={{
              width: "44px",
              height: "44px",
              objectFit: "contain",
              filter: "drop-shadow(0 0 10px rgba(245,158,11,0.55))",
              flexShrink: 0,
            }}
            priority
          />
          <div>
            <div style={{ color: "var(--gold)", fontWeight: 700, fontSize: "13px", letterSpacing: "0.08em", lineHeight: 1 }}>
              ARGUS
            </div>
            <div style={{ color: "var(--dim)", fontSize: "10px", letterSpacing: "0.03em" }}>
              Job Radar
            </div>
          </div>
        </Link>

        {/* Nav — centered, desktop only */}
        <nav
          style={{ flex: 1, display: "flex", justifyContent: "center" }}
          className="hidden lg:flex"
        >
          {NAV_ITEMS.map(({ href, labelKey }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "0 13px",
                  height: "54px",
                  display: "flex",
                  alignItems: "center",
                  background: "transparent",
                  borderBottom: active ? "2px solid var(--gold)" : "2px solid transparent",
                  borderTop: "2px solid transparent",
                  color: active ? "var(--gold)" : "var(--muted)",
                  fontWeight: active ? 600 : 400,
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
              >
                {labelKey}
              </Link>
            );
          })}
        </nav>

        {/* Spacer on mobile */}
        <div className="flex-1 lg:hidden" />

        {/* Actions — fixed right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            width: "152px",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          {/* Omnisearch — desktop */}
          <div className="hidden lg:block">
            <OmniSearch />
          </div>

          {/* Language toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "pt" : "en")}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              cursor: "pointer",
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
            title={lang === "en" ? "Mudar para Português" : "Switch to English"}
          >
            {lang === "en" ? "PT" : "EN"}
          </button>

          {/* Avatar / logout — desktop */}
          <button
            type="button"
            onClick={() => void handleLogout()}
            style={{
              width: "28px",
              height: "28px",
              background: "linear-gradient(135deg, var(--gold), #b45309)",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              color: "#020810",
              fontWeight: 700,
              fontSize: "11px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="hidden lg:flex"
            title="Sign out"
          >
            M
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}
            className="flex lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          style={{
            backgroundColor: "var(--surf)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: "54px",
            zIndex: 30,
          }}
          className="lg:hidden"
        >
          <nav style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>
            {NAV_ITEMS.map(({ href, labelKey }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "11px 20px",
                    fontSize: "14px",
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--gold)" : "var(--muted)",
                    borderLeft: active ? "2px solid var(--gold)" : "2px solid transparent",
                    textDecoration: "none",
                  }}
                >
                  {labelKey}
                </Link>
              );
            })}
            <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0 0" }}>
              <button
                type="button"
                onClick={() => void handleLogout()}
                style={{
                  display: "flex",
                  width: "100%",
                  padding: "10px 20px",
                  fontSize: "13px",
                  color: "var(--dim)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
