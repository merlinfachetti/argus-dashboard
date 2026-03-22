import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { candidateProfile, trackedSources } from "@/lib/profile";

const launcherCards = [
  {
    href: "/control-center",
    eyebrow: "Operate",
    title: "Control Center",
    description:
      "O workspace para agir sobre a vaga ativa com match, riscos, mensagem e status sem distração.",
    tone:
      "border-slate-900/80 bg-[linear-gradient(180deg,rgba(8,17,31,1),rgba(15,23,42,0.98))] text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]",
    accent: "text-sky-300",
    cta: "Abrir workspace",
  },
  {
    href: "/jobs",
    eyebrow: "Explore",
    title: "Jobs Explorer",
    description:
      "Busca viva, preview, filtros e detalhe individual para encontrar as vagas certas antes de agir.",
    tone:
      "border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.08)]",
    accent: "text-slate-500",
    cta: "Explorar oportunidades",
  },
  {
    href: "/dashboard",
    eyebrow: "Direct",
    title: "Pipeline Board",
    description:
      "Uma leitura executiva do funil com lanes, comparação de prioridade e foco no próximo movimento.",
    tone:
      "border-white/80 bg-[linear-gradient(180deg,rgba(255,250,245,0.96),rgba(255,255,255,0.92))] text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.08)]",
    accent: "text-slate-500",
    cta: "Abrir panorama",
  },
] as const;

const valuePillars = [
  {
    title: "Private opportunity intelligence",
    body:
      "Argus consolida descoberta, leitura, triagem, score e operação em uma superfície única.",
  },
  {
    title: "Moat through workflow compression",
    body:
      "O ganho não está só em achar vagas, mas em cortar fricção repetitiva em toda a rotina diária.",
  },
  {
    title: "Action-first architecture",
    body:
      "Cada área do produto foi separada por intenção: buscar, decidir, operar, automatizar e governar.",
  },
] as const;

export default function Home() {
  const liveSources = trackedSources.filter((source) => /live/i.test(source.status));

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-10 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Home"
        title="Um private job radar desenhado para parecer uma operação de elite, não um painel improvisado."
        description="Argus existe para transformar hunting em um sistema: descobrir cedo, priorizar com inteligência, operar rápido e reduzir o custo mental do processo inteiro."
        metrics={[
          { label: "Perfil ativo", value: "1", tone: "accent" },
          { label: "Live sources", value: `${liveSources.length}`, tone: "light" },
          { label: "Target portals", value: `${trackedSources.length}`, tone: "light" },
          { label: "Mode", value: "Command", tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/jobs"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Entrar em Jobs Explorer
            </Link>
            <Link
              href="/control-center"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Abrir mission control
            </Link>
          </>
        }
        aside={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Strategic snapshot
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {candidateProfile.headline}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Perfil principal pronto para abastecer scoring, recruiter draft e rotina diária de oportunidades.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Location
                </p>
                <p className="mt-2 text-base font-semibold">{candidateProfile.location}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Core signal
                </p>
                <p className="mt-2 text-base font-semibold">
                  {candidateProfile.coreStack.slice(0, 3).join(" · ")}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <section className="grid gap-5 xl:grid-cols-3">
        {launcherCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group relative overflow-hidden rounded-[34px] border p-7 transition hover:-translate-y-1 hover:shadow-[0_32px_110px_rgba(15,23,42,0.14)] ${card.tone}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_30%)]" />
            <div className="relative">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${card.accent}`}>
                {card.eyebrow}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {card.title}
              </p>
              <p className="mt-4 text-sm leading-7 text-current/75">
                {card.description}
              </p>
              <p className="mt-8 text-sm font-semibold">
                {card.cta}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[38px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,250,250,0.84))] p-7 shadow-[0_28px_100px_rgba(15,23,42,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Product moat
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
            Valor percebido vem de compressão de workflow, não só de UI bonita.
          </h2>
          <div className="mt-8 grid gap-4">
            {valuePillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]"
              >
                <h3 className="text-lg font-semibold text-slate-950">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[38px] border border-slate-900/80 bg-[linear-gradient(180deg,rgba(8,17,31,1),rgba(15,23,42,0.98))] p-7 text-white shadow-[0_28px_100px_rgba(15,23,42,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300">
            Live operating loop
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
            O produto precisa vender a sensação de controle logo na entrada.
          </h2>
          <div className="mt-8 space-y-4">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Step 01
              </p>
              <p className="mt-2 text-lg font-semibold">Puxar vagas reais dos portais vivos</p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Step 02
              </p>
              <p className="mt-2 text-lg font-semibold">Priorizar por aderência e próxima ação</p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Step 03
              </p>
              <p className="mt-2 text-lg font-semibold">Entrar no control center e operar sem perda de contexto</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
