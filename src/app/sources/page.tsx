import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { trackedSources } from "@/lib/profile";

const liveDiscoveryLinks: Record<string, string> = {
  Siemens: "/control-center?source=siemens",
  Rheinmetall: "/control-center?source=rheinmetall",
  BWI: "/control-center?source=bwi",
};

export default function SourcesPage() {
  const liveSources = trackedSources.filter((source) =>
    /live/i.test(source.status),
  );
  const queuedSources = trackedSources.filter((source) => !/live/i.test(source.status));

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Sources"
        title="Uma sala de controle para as fontes do crawler, não só uma lista escondida no produto."
        description="Aqui você acompanha quais portais já têm discovery real, quais já estão catalogados para crawler e quais podem ser puxados para o Control Center com um clique."
        metrics={[
          { label: "Total sources", value: `${trackedSources.length}`, tone: "accent" },
          { label: "Live discovery", value: `${liveSources.length}`, tone: "light" },
          { label: "Queued", value: `${queuedSources.length}`, tone: "light" },
          { label: "Mode", value: "Ops", tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/control-center"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Abrir control center
            </Link>
            <Link
              href="/jobs"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Ver jobs
            </Link>
          </>
        }
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Source ops
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Fontes vivas e fila de expansão
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Objetivo
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Transformar o radar em um pipeline multi-empresa com governança clara por fonte.
              </p>
            </div>
          </div>
        }
      />

      <section className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-[36px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 pb-5">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
              Discovery live
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Fontes prontas para puxar vagas agora
            </h2>
          </div>

          <div className="mt-6 grid gap-4">
            {liveSources.map((source) => (
              <article
                key={source.company}
                className="rounded-[28px] border border-slate-200 bg-white/92 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {source.company}
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {source.strategy}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      Status atual: {source.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={liveDiscoveryLinks[source.company] ?? "/control-center"}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Abrir discovery
                    </Link>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    >
                      Abrir portal
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,243,0.9))] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 pb-5">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
              Fila de expansão
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Portais já catalogados para os próximos conectores
            </h2>
          </div>

          <div className="mt-6 grid gap-3">
            {queuedSources.map((source) => (
              <article
                key={source.company}
                className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      {source.company}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      {source.strategy}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                    {source.status}
                  </span>
                </div>
                <div className="mt-4">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    Abrir portal
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
