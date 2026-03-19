import { JobDetailWorkspace } from "@/components/job-detail-workspace";
import { candidateProfile } from "@/lib/profile";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Job Detail
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Leitura completa da vaga em uma pagina dedicada
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-500">
          Aqui o foco fica em decidir rapido: aderencia, riscos, historico,
          status e a melhor proxima acao para essa vaga.
        </p>
      </section>

      <JobDetailWorkspace jobId={decodeURIComponent(jobId)} profile={candidateProfile} />
    </div>
  );
}
