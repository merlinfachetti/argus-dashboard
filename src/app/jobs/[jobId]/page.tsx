import Link from "next/link";
import { JobDetailWorkspace } from "@/components/job-detail-workspace";
import { PageHero } from "@/components/page-hero";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Job Detail"
        title="Uma leitura dedicada para decidir se vale priorizar, aplicar ou seguir para operação."
        description="Esta tela isola a vaga em uma experiência própria, com mais respiro e mais clareza para revisar match, histórico e próxima ação."
        metrics={[
          { label: "Languages", value: `${profile.languages.length}`, tone: "accent" },
          { label: "Core stack", value: `${profile.coreStack.length}`, tone: "light" },
          { label: "Target roles", value: `${profile.targetRoles.length}`, tone: "light" },
          { label: "Mode", value: "Read", tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/jobs"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Voltar para jobs
            </Link>
            <Link
              href="/control-center"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Abrir control center
            </Link>
          </>
        }
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Objective
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Decidir rapido e com mais confianca
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Fluxo
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Explorer para buscar, detalhe para entender, control center para agir.
              </p>
            </div>
          </div>
        }
      />

      <JobDetailWorkspace jobId={decodeURIComponent(jobId)} profile={profile} />
    </div>
  );
}
