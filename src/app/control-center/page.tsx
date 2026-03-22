import { ArgusWorkbench } from "@/components/argus-workbench";
import { PageHero } from "@/components/page-hero";
import { defaultJobDescription, trackedSources } from "@/lib/profile";
import { getPersistedCandidateProfile } from "@/lib/profile-store";

export default async function ControlCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; source?: "siemens" | "rheinmetall" }>;
}) {
  const params = await searchParams;
  const { profile } = await getPersistedCandidateProfile();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Control Center"
        title="O workspace principal para agir sobre a vaga ativa sem ruído desnecessário."
        description="Aqui a interface fica centrada na vaga em foco. O objetivo é revisar aderência, entender riscos, gerar mensagem e mudar o status sem misturar com leitura de lista."
        metrics={[
          { label: "Portais foco", value: `${trackedSources.length}`, tone: "accent" },
          { label: "Stack core", value: `${profile.coreStack.length}`, tone: "light" },
          { label: "Languages", value: `${profile.languages.length}`, tone: "light" },
          { label: "Mode", value: "Operate", tone: "dark" },
        ]}
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Operacao
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Match, mensagem e status em uma area unica
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Uso ideal
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Entrar aqui depois de escolher uma vaga no explorer ou no detalhe individual.
              </p>
            </div>
          </div>
        }
      />

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
