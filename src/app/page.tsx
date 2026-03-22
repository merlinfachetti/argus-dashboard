import Link from "next/link";
import { candidateProfile, trackedSources } from "@/lib/profile";

const launcherCards = [
  {
    href: "/control-center",
    eyebrow: "Operate",
    title: "Control Center",
    description:
      "Workspace principal para agir sobre a vaga ativa — match, riscos, mensagem e status sem distração.",
    dark: true,
    cta: "Abrir workspace →",
  },
  {
    href: "/jobs",
    eyebrow: "Explore",
    title: "Jobs Explorer",
    description:
      "Busca viva, preview rápido, filtros e acesso ao detalhe de cada oportunidade no radar.",
    dark: false,
    cta: "Explorar vagas →",
  },
  {
    href: "/dashboard",
    eyebrow: "Pipeline",
    title: "Dashboard",
    description:
      "Leitura executiva do funil com lanes, comparação de prioridade e foco no próximo movimento.",
    dark: false,
    cta: "Ver pipeline →",
  },
] as const;

const operatingLoop = [
  { n: "01", label: "Puxar vagas reais dos portais vivos" },
  { n: "02", label: "Priorizar por aderência e próxima ação" },
  { n: "03", label: "Operar no control center sem perda de contexto" },
  { n: "04", label: "Receber o digest matinal e reagir ao radar" },
] as const;

export default function Home() {
  const liveSources = trackedSources.filter((s) => /live/i.test(s.status));

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">

      {/* Hero — split clean */}
      <section className="relative overflow-hidden rounded-[36px] border border-slate-200/60 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_5%_10%,rgba(56,189,248,0.08),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(249,115,22,0.06),transparent_35%)]" />

        <div className="relative grid gap-0 xl:grid-cols-[1fr_340px]">
          {/* Left */}
          <div className="border-r border-slate-200/60 p-8 xl:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Private Radar
            </div>

            <h1 className="mt-5 max-w-xl text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950">
              Um cockpit privado para transformar hunting em operação.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-7 text-slate-500">
              Discovery real, leitura estruturada, score de aderência, prioridade e rotina de candidatura em uma experiência única.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href="/jobs"
                className="rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.2)] transition hover:bg-slate-800"
              >
                Entrar em Jobs
              </Link>
              <Link
                href="/control-center"
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Abrir Control Center
              </Link>
            </div>

            {/* Metrics row */}
            <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: "Perfil ativo", value: "1", accent: true },
                { label: "Live sources", value: `${liveSources.length}` },
                { label: "Total portais", value: `${trackedSources.length}` },
                { label: "Mode", value: "Command", dark: true },
              ].map((m) => (
                <div
                  key={m.label}
                  className={[
                    "rounded-2xl border p-4",
                    m.dark
                      ? "border-slate-800 bg-slate-950 text-white"
                      : m.accent
                        ? "border-sky-200/80 bg-gradient-to-b from-sky-50 to-white text-slate-950"
                        : "border-slate-200/80 bg-white/90 text-slate-950",
                  ].join(" ")}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-50">
                    {m.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — profile snapshot */}
          <div className="relative bg-gradient-to-b from-slate-950 to-slate-900 p-8 text-white xl:rounded-r-[36px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_40%)] xl:rounded-r-[36px]" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400">
                Strategic profile
              </p>
              <p className="mt-4 text-xl font-semibold leading-snug tracking-tight">
                {candidateProfile.headline}
              </p>
              <p className="mt-3 text-[13px] leading-6 text-slate-400">
                {candidateProfile.location} · {candidateProfile.availability}
              </p>

              <div className="mt-6 space-y-2.5">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Core stack
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium text-slate-200">
                    {candidateProfile.coreStack.slice(0, 4).join(" · ")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Idiomas
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium text-slate-200">
                    {candidateProfile.languages.join(" · ")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Target roles
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium text-slate-200">
                    {candidateProfile.targetRoles.slice(0, 2).join(" · ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Launcher cards */}
      <section className="grid gap-4 xl:grid-cols-3">
        {launcherCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={[
              "group relative overflow-hidden rounded-[28px] border p-7 transition hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)]",
              card.dark
                ? "border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 text-white"
                : "border-slate-200/80 bg-white/90 text-slate-950",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_50%)]" />
            <div className="relative">
              <p
                className={[
                  "text-[11px] font-semibold uppercase tracking-[0.22em]",
                  card.dark ? "text-sky-400" : "text-slate-400",
                ].join(" ")}
              >
                {card.eyebrow}
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight">
                {card.title}
              </p>
              <p
                className={[
                  "mt-3 text-[13px] leading-6",
                  card.dark ? "text-slate-400" : "text-slate-500",
                ].join(" ")}
              >
                {card.description}
              </p>
              <p
                className={[
                  "mt-6 text-[13px] font-semibold transition group-hover:translate-x-0.5",
                  card.dark ? "text-sky-400" : "text-slate-950",
                ].join(" ")}
              >
                {card.cta}
              </p>
            </div>
          </Link>
        ))}
      </section>

      {/* Operating loop + value props */}
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {/* Loop */}
        <div className="rounded-[28px] border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-7 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400">
            Operating loop
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
            Descobrir, priorizar, operar, repetir.
          </h2>
          <div className="mt-6 space-y-2">
            {operatingLoop.map((step) => (
              <div
                key={step.n}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-5 py-4"
              >
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-600">
                  {step.n}
                </span>
                <span className="text-[13px] font-medium text-slate-200">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Value */}
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Product moat
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-slate-950">
            Valor real vem de compressão de workflow, não de UI bonita.
          </h2>
          <div className="mt-6 space-y-3">
            {[
              {
                title: "Private opportunity intelligence",
                body: "Consolida descoberta, leitura, triagem, score e operação em uma superfície única.",
              },
              {
                title: "Moat through workflow compression",
                body: "O ganho está em cortar fricção repetitiva em toda a rotina diária de hunting.",
              },
              {
                title: "Action-first architecture",
                body: "Cada área foi separada por intenção: buscar, decidir, operar, automatizar e governar.",
              },
            ].map((p) => (
              <article
                key={p.title}
                className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4"
              >
                <h3 className="text-[13px] font-semibold text-slate-950">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-slate-500">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
