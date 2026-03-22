import { ArgusWorkbench } from "@/components/argus-workbench";
import { defaultJobDescription, trackedSources } from "@/lib/profile";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export default async function ControlCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; source?: "siemens" | "rheinmetall" | "bwi" }>;
}) {
  const params = await searchParams;
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] px-6 py-8 lg:px-10 lg:py-10">
      {/* Control Center não usa PageHero — a vaga ativa É o hero */}
      <ArgusWorkbench
        profile={profile}
        sources={trackedSources}
        initialJobDescription={defaultJobDescription}
        pageMode="control"
        initialActiveJobId={params.job}
        initialDiscoverySource={params.source}
      />
    </div>
  );
}
