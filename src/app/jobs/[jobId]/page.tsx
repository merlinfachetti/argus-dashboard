import Link from "next/link";
import { JobDetailWorkspace } from "@/components/job-detail-workspace";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 px-6 py-10 lg:px-10 lg:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--dim)" }}>
        <Link href="/jobs" className="transition" style={{ color: "var(--muted)" }}>Jobs</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>Detalhe</span>
      </div>

      <JobDetailWorkspace jobId={decodeURIComponent(jobId)} profile={profile} />
    </div>
  );
}
