import { ArgusWorkbench } from "@/components/argus-workbench";
import {
  candidateProfile,
  defaultJobDescription,
  trackedSources,
} from "@/lib/profile";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-8 lg:px-10 lg:py-10">
      <section className="grid gap-6 rounded-[32px] border border-white/60 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Argus
            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] tracking-[0.22em] text-white">
              MVP
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Seu radar privado para encontrar, organizar e priorizar vagas
              com velocidade.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Primeira base funcional do produto: perfil inicial carregado do
              seu CV, monitoramento dos portais-alvo e um fluxo manual para
              colar qualquer job description, estruturar a vaga, calcular match
              e gerar a mensagem de abordagem.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-500">
                Perfil base inicial
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {candidateProfile.headline}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-500">
                Fontes priorizadas
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {trackedSources.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-500">
                Entrega desta etapa
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                Intake manual + dashboard
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
            Nome recomendado
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Argus</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            O vigilante de cem olhos da mitologia grega. Combina com um produto
            que observa múltiplos portais, identifica oportunidades cedo e te
            devolve tudo organizado com contexto.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <p className="font-medium text-white">Outras opções fortes</p>
            <p>Hermes: foco em velocidade, comunicação e entrega.</p>
            <p>Heimdall: foco em vigilância, prontidão e triagem.</p>
            <p>Athena: foco em estratégia, discernimento e decisão.</p>
          </div>
        </aside>
      </section>

      <ArgusWorkbench
        profile={candidateProfile}
        sources={trackedSources}
        initialJobDescription={defaultJobDescription}
      />
    </main>
  );
}
