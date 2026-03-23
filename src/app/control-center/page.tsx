import { ArgusWorkbench } from "@/components/argus-workbench";
import { defaultJobDescription, trackedSources } from "@/lib/profile";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export default async function ControlCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; source?: "siemens" | "rheinmetall" | "bwi" | "hensoldt" | "secunet" | "rohde-schwarz" | "airbus" | "hensoldt" }>;
}) {
  const params = await searchParams;
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
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
