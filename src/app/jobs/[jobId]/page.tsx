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
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        <Link href="/jobs" className="transition hover:text-slate-700">Jobs</Link>
        <span>/</span>
        <span className="text-slate-600">Detalhe</span>
      </div>

      <JobDetailWorkspace jobId={decodeURIComponent(jobId)} profile={profile} />
    </div>
  );
}
