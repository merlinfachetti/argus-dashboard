import { ArgusWorkbench } from "@/components/argus-workbench";
import { PageHero } from "@/components/page-hero";
import { defaultJobDescription, trackedSources } from "@/lib/profile";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export default async function DashboardPage() {
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <PageHero
        variant="compact"
        eyebrow="Dashboard"
        title="Pipeline — funnel, gaps and priority."
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
