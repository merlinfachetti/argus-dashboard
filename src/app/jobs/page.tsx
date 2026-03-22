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
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <PageHero
        variant="minimal"
        eyebrow="Jobs Explorer"
        title="Radar de vagas — buscar, filtrar, priorizar e agir."
        description="Spotlight automático nas melhores oportunidades, filtros inline e acesso direto ao detalhe ou ao control center."
        metrics={[
          { label: "Busca ativa", value: initialRadarQuery.trim() ? "Sim" : "—", tone: initialRadarQuery.trim() ? "accent" : "light" },
          { label: "Portais foco", value: `${trackedSources.length}`, tone: "light" },
          { label: "Roles alvo", value: `${profile.targetRoles.length}`, tone: "light" },
          { label: "Mode", value: "Explorer", tone: "dark" },
        ]}
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
