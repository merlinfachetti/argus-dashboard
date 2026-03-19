import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { candidateProfile, trackedSources } from "@/lib/profile";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-10 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Home"
        title="Um radar privado de vagas com áreas separadas para buscar, decidir e operar."
        description="A interface agora parte de um launcher mais nobre e mais claro. Cada parte do produto tem seu espaço: lista, funil, vaga ativa e leitura detalhada."
        metrics={[
          { label: "Perfil ativo", value: "1", tone: "accent" },
          { label: "Portais foco", value: `${trackedSources.length}`, tone: "light" },
          { label: "Core stack", value: `${candidateProfile.coreStack.length}`, tone: "light" },
          { label: "Target roles", value: `${candidateProfile.targetRoles.length}`, tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/jobs"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Explorar vagas
            </Link>
            <Link
              href="/control-center"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Abrir control center
            </Link>
          </>
        }
        aside={
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Snapshot
              </p>
              <p className="mt-3 text-2xl font-semibold">{candidateProfile.headline}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Base inicial carregada do perfil principal com foco em engenharia de produto, plataforma e automacao.
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
                  Languages
                </p>
                <p className="mt-2 text-base font-semibold">
                  {candidateProfile.languages.join(" · ")}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <Link
          href="/control-center"
          className="group rounded-[32px] border border-white/70 bg-white/88 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.12)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Control Center
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Operacao viva da vaga ativa
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Match, riscos, mensagem, intake manual e descoberta real no mesmo workspace.
          </p>
          <p className="mt-6 text-sm font-semibold text-slate-950 transition group-hover:text-sky-700">
            Entrar no workspace
          </p>
        </Link>

        <Link
          href="/dashboard"
          className="group rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.12)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Dashboard
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Leitura executiva do pipeline
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Lanes, comparativos e sinais de prioridade para decidir onde agir primeiro.
          </p>
          <p className="mt-6 text-sm font-semibold text-slate-950 transition group-hover:text-sky-700">
            Abrir panorama
          </p>
        </Link>

        <Link
          href="/jobs"
          className="group rounded-[32px] border border-slate-900/80 bg-[linear-gradient(180deg,rgba(15,23,42,1),rgba(30,41,59,0.98))] p-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] transition hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.22)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300">
            Jobs
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight">
            Explorer focado em buscar e selecionar
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Busca permanente, filtros, preview e detalhe individual por vaga.
          </p>
          <p className="mt-6 text-sm font-semibold text-white transition group-hover:text-sky-300">
            Ir para vagas
          </p>
        </Link>
      </section>
    </div>
  );
}
