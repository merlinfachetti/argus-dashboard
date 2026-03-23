"use client";

import Link from "next/link";
import { useState } from "react";
import { trackedSources } from "@/lib/profile";

const liveDiscoveryLinks: Record<string, string> = {
  Siemens:          "/control-center?source=siemens",
  Rheinmetall:      "/control-center?source=rheinmetall",
  BWI:              "/control-center?source=bwi",
  Hensoldt:         "/control-center?source=hensoldt",
  secunet:          "/control-center?source=secunet",
  "Rohde & Schwarz": "/control-center?source=rohde-schwarz",
  Airbus: "/control-center?source=airbus",
};

export default function SourcesPage() {
  const liveSources    = trackedSources.filter((s) => /live/i.test(s.status));
  const pendingSources = trackedSources.filter((s) => !/live/i.test(s.status));
  const [jdText, setJdText]         = useState("");
  const [activeSource, setActiveSource] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">

      {/* Header */}
      <div className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Sources</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Portais de vagas — discovery e intake
          </h1>
          <div className="flex gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
              {liveSources.length} live
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-500">
              {pendingSources.length} catalogadas
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        {/* Coluna esquerda — portais */}
        <div className="space-y-5">

          {/* Live — discovery automático */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Discovery automático
            </p>
            <div className="space-y-2">
              {liveSources.map((source) => (
                <div
                  key={source.company}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-950">{source.company}</p>
                      <span style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }} className="rounded-full px-2 py-0.5 text-[10px] font-bold">
                        live
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-500">{source.strategy}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={liveDiscoveryLinks[source.company] ?? "/control-center"}
                      style={{ background: "#0f172a", color: "#fff" }}
                      className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition hover:opacity-80"
                    >
                      Buscar vagas
                    </Link>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
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
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Catalogadas — acesso direto ao portal
            </p>
            <div className="space-y-1.5">
              {pendingSources.map((source) => (
                <div
                  key={source.company}
                  className={[
                    "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
                    activeSource === source.company
                      ? "border-sky-200 bg-sky-50"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-950">{source.company}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400 truncate">{source.strategy}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 sm:block">
                      {source.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSource(
                        activeSource === source.company ? null : source.company
                      )}
                      style={
                        activeSource === source.company
                          ? { background: "#0f172a", color: "#fff" }
                          : {}
                      }
                      className={[
                        "rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                        activeSource === source.company
                          ? "border-transparent"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {activeSource === source.company ? "× Fechar" : "Intake"}
                    </button>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Intake rápido
            </p>
            <h2 className="mt-1 text-[15px] font-semibold text-slate-950">
              {activeSource ? `Vaga de ${activeSource}` : "Cole qualquer JD aqui"}
            </h2>
            <p className="mt-1 text-[12px] text-slate-500">
              {activeSource
                ? `Abra o portal da ${activeSource}, encontre a vaga e cole o texto completo abaixo.`
                : "Funciona com qualquer portal — mesmo desorganizado. Selecione uma empresa acima ou cole direto."}
            </p>

            {/* Link do portal ativo */}
            {activeSource && (
              <a
                href={pendingSources.find((s) => s.company === activeSource)?.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition hover:opacity-80"
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
              className="mt-4 min-h-[200px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[13px] leading-6 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
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
                    // Salvar no sessionStorage para o CC pegar
                    sessionStorage.setItem("argus-quick-intake", jdText.trim());
                    if (activeSource) {
                      sessionStorage.setItem("argus-quick-intake-company", activeSource);
                    }
                  }
                }}
                style={{ background: "#0f172a", color: "#fff" }}
                className="flex-1 rounded-full py-2.5 text-center text-[13px] font-semibold transition hover:opacity-80"
              >
                {jdText.trim() ? "Processar no CC →" : "Ir para Control Center"}
              </Link>
              {jdText.trim() && (
                <button
                  type="button"
                  onClick={() => { setJdText(""); setActiveSource(null); }}
                  className="rounded-full border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Limpar
                </button>
              )}
            </div>

            {jdText.trim() && (
              <p className="mt-2 text-[11px] text-slate-400">
                {jdText.length} caracteres · o Argus estrutura, calcula match e salva no radar automaticamente
              </p>
            )}
          </div>

          {/* Como funciona — guia inline */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Como usar</p>
            <div className="mt-3 space-y-2.5">
              {[
                { n: "01", text: "Para portais live, clique em 'Buscar vagas' — o discovery roda automático." },
                { n: "02", text: "Para os outros, clique em '↗ Portal' para abrir, encontre a vaga e volte aqui." },
                { n: "03", text: "Cole o texto completo da vaga no campo ao lado e clique em 'Processar no CC'." },
                { n: "04", text: "O Argus estrutura, calcula o score e cria a mensagem para o recruiter em segundos." },
              ].map((step) => (
                <div key={step.n} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-[10px] font-bold text-slate-400">{step.n}</span>
                  <p className="text-[12px] leading-5 text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
