import { ArgusWorkbench } from "@/components/argus-workbench";
import {
  candidateProfile,
  defaultJobDescription,
  trackedSources,
} from "@/lib/profile";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const initialRadarQuery = params.q ?? "";

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Jobs
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Lista focada de vagas com busca permanente
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-500">
          A busca do header sempre leva para esta pagina. Aqui o foco fica em
          encontrar, abrir e priorizar vagas sem distração de outras áreas.
        </p>
      </section>

      <ArgusWorkbench
        profile={candidateProfile}
        sources={trackedSources}
        initialJobDescription={defaultJobDescription}
        pageMode="jobs"
        initialRadarQuery={initialRadarQuery}
      />
    </div>
  );
}
