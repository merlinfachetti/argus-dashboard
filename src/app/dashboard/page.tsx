import { ArgusWorkbench } from "@/components/argus-workbench";
import { PageHero } from "@/components/page-hero";
import { defaultJobDescription, trackedSources } from "@/lib/profile";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export default async function DashboardPage() {
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        variant="compact"
        eyebrow="Dashboard"
        title="Pipeline — funil, gargalos e prioridade do radar."
        metrics={[
          { label: "Portais", value: `${trackedSources.length}`, tone: "accent" },
          { label: "Stack", value: `${profile.coreStack.length}`, tone: "light" },
          { label: "Mode", value: "Pipeline", tone: "dark" },
        ]}
      />

      <ArgusWorkbench
        profile={profile}
        sources={trackedSources}
        initialJobDescription={defaultJobDescription}
        pageMode="dashboard"
      />
    </div>
  );
}
