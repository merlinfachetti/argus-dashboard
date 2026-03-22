import { ArgusWorkbench } from "@/components/argus-workbench";
import { PageHero } from "@/components/page-hero";
import { defaultJobDescription, trackedSources } from "@/lib/profile";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const initialRadarQuery = params.q ?? "";
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Jobs"
        title="Um explorer mais digno para buscar, comparar e abrir cada vaga com contexto."
        description="A busca permanente vive no header e esta pagina vira o lugar natural para filtrar, ler rapidamente e abrir o detalhe certo sem se perder no restante do produto."
        metrics={[
          { label: "Busca ativa", value: initialRadarQuery.trim() ? "1" : "0", tone: "accent" },
          { label: "Portais foco", value: `${trackedSources.length}`, tone: "light" },
          { label: "Roles alvo", value: `${profile.targetRoles.length}`, tone: "light" },
          { label: "Mode", value: "Explorer", tone: "dark" },
        ]}
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Query atual
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {initialRadarQuery.trim() || "Sem filtro global"}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Uso ideal
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Filtrar no topo, inspecionar rapidamente e abrir o detalhe ou o control center quando fizer sentido.
              </p>
            </div>
          </div>
        }
      />

      <ArgusWorkbench
        profile={profile}
        sources={trackedSources}
        initialJobDescription={defaultJobDescription}
        pageMode="jobs"
        initialRadarQuery={initialRadarQuery}
      />
    </div>
  );
}
