import Link from "next/link";
import { candidateProfile, trackedSources } from "@/lib/profile";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-10 px-6 py-10 lg:px-10 lg:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[40px] border border-white/60 bg-white/88 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Argus
            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] tracking-[0.22em] text-white">
              Launcher
            </span>
          </div>

          <div className="mt-7 space-y-5">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
              Entre pelo destino certo e mantenha cada parte do produto no seu
              lugar.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              A home agora ficou mais leve. O fluxo operacional foi separado em
              paginas dedicadas para vaga ativa, dashboard e lista de vagas.
            </p>
          </div>

          <div className="mt-10 grid gap-4 xl:grid-cols-3">
            <Link
              href="/control-center"
              className="rounded-[28px] border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Control Center
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                Vaga ativa
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Workspace focado em match, riscos, mensagem e gestao da vaga ativa.
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="rounded-[28px] border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Dashboard
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                Pipeline visual
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Lanes por status, comparativos e leitura mais clara do funil.
              </p>
            </Link>

            <Link
              href="/jobs"
              className="rounded-[28px] border border-slate-900/80 bg-slate-950 p-6 text-white transition hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                Jobs
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                Lista focada
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Veja todas as vagas com foco total em busca, leitura e selecao.
              </p>
            </Link>
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
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
