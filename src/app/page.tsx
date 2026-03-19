import { ArgusWorkbench } from "@/components/argus-workbench";
import {
  candidateProfile,
  defaultJobDescription,
  trackedSources,
} from "@/lib/profile";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[rgba(252,250,247,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
              A
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Argus Dashboard
              </p>
              <p className="text-sm text-slate-600">
                Radar privado para vagas e triagem operacional
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <a
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              href="#workspace"
            >
              Workspace
            </a>
            <a
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              href="#radar"
            >
              Radar
            </a>
            <a
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              href="#profile"
            >
              Perfil
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-8 lg:px-10 lg:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[36px] border border-white/60 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Argus
              <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] tracking-[0.22em] text-white">
                MVP
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Um portal mais limpo para buscar, ler e priorizar vagas sem se
                perder no processo.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                O foco agora e funcionamento pleno com uma UX enxuta: uma vaga
                ativa por vez, fonte real ou JD manual como modos separados e um
                radar operacional para acompanhar o que vale aplicar.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                href="#workspace"
              >
                Abrir workspace
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                href="#radar"
              >
                Ver radar
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                href="#profile"
              >
                Revisar perfil
              </a>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Perfil ativo
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {candidateProfile.headline}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Portais priorizados
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {trackedSources.length}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Foco da entrega
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  Clareza + fluxo
                </p>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Nome do produto
              </p>
              <h2 className="mt-3 text-3xl font-semibold">Argus</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Vigilancia de multiplas fontes, priorizacao rapida e leitura
                objetiva da melhor proxima vaga.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/60 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                Fluxo principal
              </p>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  1. Buscar vagas reais ou colar um JD
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  2. Tornar uma vaga ativa
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  3. Revisar match, riscos e abordagem
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  4. Atualizar status no radar
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section id="workspace">
          <ArgusWorkbench
            profile={candidateProfile}
            sources={trackedSources}
            initialJobDescription={defaultJobDescription}
          />
        </section>
      </main>

      <footer className="border-t border-slate-200/70 bg-[rgba(252,250,247,0.76)] backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-6 text-sm text-slate-500 lg:grid-cols-[1fr_auto] lg:px-10">
          <div>
            Argus Dashboard centraliza discovery, leitura de JD, scoring e
            gestao do radar em um fluxo mais claro e objetivo.
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Siemens connector
            </span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Next.js
            </span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Prisma
            </span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Vercel
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
