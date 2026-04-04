"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/lib/i18n/context";
import { trackedSources } from "@/lib/profile";

export const dynamic = "force-dynamic";


const liveDiscoveryLinks: Record<string, string> = {
  Siemens:          "/control-center?source=siemens",
  Rheinmetall:      "/control-center?source=rheinmetall",
  BWI:              "/control-center?source=bwi",
  Hensoldt:         "/control-center?source=hensoldt",
  secunet:          "/control-center?source=secunet",
  "Rohde & Schwarz": "/control-center?source=rohde-schwarz",
  Airbus:           "/control-center?source=airbus",
  Bayer:            "/control-center?source=bayer",
  SAP:              "/control-center?source=sap",
  Eviden:           "/control-center?source=eviden",
  Diehl:            "/control-center?source=diehl",
  TKMS:             "/control-center?source=tkms",
};

export default function SourcesPage() {
  const t = useT();
  const liveSources    = trackedSources.filter((s) => /live/i.test(s.status));
  const pendingSources = trackedSources.filter((s) => !/live/i.test(s.status));
  const [jdText, setJdText]         = useState("");
  const [activeSource, setActiveSource] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">

      {/* Header */}
      <div className="mb-6 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Sources</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            {t("sources.subtitle")}
          </h1>
          <div className="flex gap-2">
            <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: "rgba(16,185,129,.15)", color: "#10b981", border: "1px solid rgba(16,185,129,.3)" }}>
              {liveSources.length} live
            </span>
            <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: "rgba(148,163,184,.1)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              {pendingSources.length} catalogadas
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[1fr_380px]">
        {/* Coluna esquerda — portais */}
        <div className="space-y-5">

          {/* Live — discovery automático */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#10b981" }}>
              {t("sources.autoDiscovery")}
            </p>
            <div className="space-y-2">
              {liveSources.map((source) => (
                <div
                  key={source.company}
                  className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>{source.company}</p>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(16,185,129,.15)", color: "#10b981", border: "1px solid rgba(16,185,129,.3)" }}>
                        live
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px]" style={{ color: "var(--dim)" }}>{source.strategy}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={liveDiscoveryLinks[source.company] ?? "/control-center"}
                      className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition hover:opacity-80"
                      style={{ background: "var(--gold)", color: "#000" }}
                    >
                      {t("sources.openDiscovery")}
                    </Link>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition"
                      style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
                    >
                      Portal ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Catalogadas — acesso rápido + intake */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              {t("sources.catalogued")}
            </p>
            <div className="space-y-1.5">
              {pendingSources.map((source) => (
                <div
                  key={source.company}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition"
                  style={activeSource === source.company
                    ? { background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.3)" }
                    : { background: "var(--card)", border: "1px solid var(--border)" }
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{source.company}</p>
                    <p className="mt-0.5 text-[11px] truncate" style={{ color: "var(--dim)" }}>{source.strategy}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:block" style={{ background: "rgba(148,163,184,.1)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                      {source.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSource(
                        activeSource === source.company ? null : source.company
                      )}
                      className="rounded-full px-3 py-1 text-[11px] font-semibold transition"
                      style={activeSource === source.company
                        ? { background: "var(--gold)", color: "#000", border: "1px solid transparent" }
                        : { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }
                      }
                    >
                      {activeSource === source.company ? t("sources.close") : t("sources.intake")}
                    </button>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full px-3 py-1 text-[11px] font-semibold transition"
                      style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
                    >
                      ↗ Portal
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Coluna direita — intake rápido */}
        <aside className="space-y-4 xl:sticky xl:top-[60px]">
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Intake rápido
            </p>
            <h2 className="mt-1 text-[15px] font-semibold" style={{ color: "var(--text)" }}>
              {activeSource ? `Vaga de ${activeSource}` : t("sources.pasteAnyJD")}
            </h2>
            <p className="mt-1 text-[12px]" style={{ color: "var(--dim)" }}>
              {activeSource
                ? `Abra o portal da ${activeSource}, encontre a vaga e cole o texto completo abaixo.`
                : t("sources.pasteAnyJDDesc")}
            </p>

            {/* Link do portal ativo */}
            {activeSource && (
              <a
                href={pendingSources.find((s) => s.company === activeSource)?.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition hover:opacity-80"
                style={{ background: "rgba(59,130,246,.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,.3)" }}
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Abrir portal {activeSource} →
              </a>
            )}

            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="mt-4 min-h-[200px] w-full rounded-xl px-3 py-3 text-[13px] leading-6 outline-none transition"
              style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder={
                activeSource
                  ? `Cole aqui a descrição completa da vaga de ${activeSource}...`
                  : "Cole aqui a vaga inteira, mesmo desorganizada..."
              }
            />

            <div className="mt-3 flex gap-2">
              <Link
                href={`/control-center`}
                onClick={() => {
                  if (jdText.trim()) {
                    sessionStorage.setItem("argus-quick-intake", jdText.trim());
                    if (activeSource) {
                      sessionStorage.setItem("argus-quick-intake-company", activeSource);
                    }
                  }
                }}
                className="flex-1 rounded-full py-2.5 text-center text-[13px] font-semibold transition hover:opacity-80"
                style={{ background: "var(--gold)", color: "#000" }}
              >
                {jdText.trim() ? t("sources.processInCC") : t("sources.goToCC")}
              </Link>
              {jdText.trim() && (
                <button
                  type="button"
                  onClick={() => { setJdText(""); setActiveSource(null); }}
                  className="rounded-full px-4 py-2.5 text-[12px] font-semibold transition"
                  style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  {t("sources.clear")}
                </button>
              )}
            </div>

            {jdText.trim() && (
              <p className="mt-2 text-[11px]" style={{ color: "var(--dim)" }}>
                {jdText.length} caracteres · o Argus estrutura, calcula match e salva no radar automaticamente
              </p>
            )}
          </div>

          {/* Como funciona — guia inline */}
          <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>{t("sources.howToUse")}</p>
            <div className="mt-3 space-y-2.5">
              {[
                { n: "01", text: t("sources.step01") },
                { n: "02", text: t("sources.step02") },
                { n: "03", text: t("sources.step03") },
                { n: "04", text: t("sources.step04") },
              ].map((step) => (
                <div key={step.n} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-[10px] font-bold" style={{ color: "var(--dim)" }}>{step.n}</span>
                  <p className="text-[12px] leading-5" style={{ color: "var(--muted)" }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
