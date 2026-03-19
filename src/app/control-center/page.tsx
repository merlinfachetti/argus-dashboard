import { ArgusWorkbench } from "@/components/argus-workbench";
import {
  candidateProfile,
  defaultJobDescription,
  trackedSources,
} from "@/lib/profile";

export default async function ControlCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Control Center
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Vaga ativa e operacao principal em uma pagina dedicada
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-500">
          Aqui o foco fica em revisar a vaga ativa, trazer vagas de fontes reais
          ou intake manual e ajustar contexto do perfil sem quebrar o fluxo.
        </p>
      </section>

      <ArgusWorkbench
        profile={candidateProfile}
        sources={trackedSources}
        initialJobDescription={defaultJobDescription}
        pageMode="control"
        initialActiveJobId={params.job}
      />
    </div>
  );
}
