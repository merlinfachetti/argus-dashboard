import { ProfileEditor } from "@/components/profile-editor";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--muted)" }}>Perfil</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
          {profile.name}
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--dim)" }}>{profile.headline}</p>
      </div>
      <ProfileEditor profile={profile} />
    </div>
  );
}
