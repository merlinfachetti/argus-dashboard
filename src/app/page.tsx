import { ArgusWorkbench } from "@/components/argus-workbench";
import {
  candidateProfile,
  defaultJobDescription,
  trackedSources,
} from "@/lib/profile";

export default function Home() {
  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[rgba(15,23,42,0.9)] text-white backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[92rem] items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.28)]">
              A
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
                Argus Dashboard
              </p>
              <p className="text-sm text-slate-300">
                Radar privado para discovery, match e operacao de candidatura
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <a
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              href="#workspace"
            >
              Control Center
            </a>
            <a
              className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
              href="#radar"
            >
              Dashboard
            </a>
            <a
              className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
              href="#profile"
            >
              Perfil
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[92rem] flex-1 flex-col gap-14 px-6 py-10 lg:px-10 lg:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[40px] border border-white/60 bg-white/88 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Argus
              <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] tracking-[0.22em] text-white">
                MVP
              </span>
            </div>

            <div className="mt-7 space-y-5">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
                Um cockpit de candidatura para descobrir vagas, comparar match
                e agir sem friccao.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                A home agora funciona como launcher. O conteudo operacional fica
                distribuido nas secoes certas, com mais separacao, melhor leitura
                e menos repeticao na entrada do produto.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                href="#workspace"
              >
                Abrir control center
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-50"
                href="#radar"
              >
                Ver dashboard
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-50"
                href="#profile"
              >
                Revisar perfil
              </a>
            </div>

            <div className="mt-10 grid gap-4 xl:grid-cols-3">
              <a
                href="#workspace"
                className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Destino 1
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  Control Center
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Abra a vaga ativa, revise o match e dispare a proxima acao.
                </p>
              </a>
              <a
                href="#radar"
                className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Destino 2
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  Dashboard
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Compare vagas, leia prioridades e mova o pipeline por status.
                </p>
              </a>
              <a
                href="#profile"
                className="rounded-[28px] border border-slate-900/80 bg-slate-950 p-5 text-white transition hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                  Destino 3
                </p>
                <p className="mt-3 text-xl font-semibold text-white">
                  Perfil e Fontes
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Ajuste contexto do perfil e escolha de onde o radar vai puxar.
                </p>
              </a>
            </div>
          </div>

          <aside className="grid gap-6">
            <div className="rounded-[36px] border border-slate-900/80 bg-slate-950 p-7 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Snapshot
              </p>
              <div className="mt-5 grid gap-4">
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Perfil ativo
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {candidateProfile.headline}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Portais priorizados
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {trackedSources.length}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Foco
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    Clareza operacional
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section id="workspace" className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Control Center
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                Workspace, dashboard e perfil com mais respiro visual
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-500">
              Cada area abaixo cumpre um papel claro: operar a vaga ativa, ler
              o dashboard e ajustar contexto de perfil e fontes.
            </p>
          </div>
          <ArgusWorkbench
            profile={candidateProfile}
            sources={trackedSources}
            initialJobDescription={defaultJobDescription}
          />
        </section>
      </main>

      <footer className="mt-12 border-t border-slate-900/80 bg-slate-950 text-slate-300">
        <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
              Argus Platform
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Portal privado para discovery de vagas, leitura de job description,
              score de aderencia e operacao de candidatura.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-200">
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Next.js
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Prisma
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Vercel
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Siemens connector
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
