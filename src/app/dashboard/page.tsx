import { ArgusWorkbench } from "@/components/argus-workbench";
import { PageHero } from "@/components/page-hero";
import { defaultJobDescription, trackedSources } from "@/lib/profile";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export default async function DashboardPage() {
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Dashboard"
        title="Uma leitura mais executiva do radar, sem brigar com a operação da vaga ativa."
        description="Aqui a interface fica mais ampla e mais limpa para o funil. O objetivo é ver gargalos, prioridade e movimento do pipeline com menos ruído."
        metrics={[
          { label: "Portais foco", value: `${trackedSources.length}`, tone: "accent" },
          { label: "Core stack", value: `${profile.coreStack.length}`, tone: "light" },
          { label: "Languages", value: `${profile.languages.length}`, tone: "light" },
          { label: "Mode", value: "Pipeline", tone: "dark" },
        ]}
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Panorama
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Funil, prioridade e comparativo rapido
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Uso ideal
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Abrir quando quiser ler o radar inteiro antes de escolher uma vaga para agir.
                </p>
              </div>
            </div>
          </div>
        }
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
