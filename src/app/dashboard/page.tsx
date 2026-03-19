import { ArgusWorkbench } from "@/components/argus-workbench";
import {
  candidateProfile,
  defaultJobDescription,
  trackedSources,
} from "@/lib/profile";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Pipeline visual e leitura do radar em pagina inteira
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-500">
          Esta vista fica dedicada ao funil: lanes por status, comparativo de
          prioridade e lista do radar sem competir com o workspace da vaga ativa.
        </p>
      </section>

      <ArgusWorkbench
        profile={candidateProfile}
        sources={trackedSources}
        initialJobDescription={defaultJobDescription}
        pageMode="dashboard"
      />
    </div>
  );
}
