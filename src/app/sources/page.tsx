import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { trackedSources } from "@/lib/profile";

const liveDiscoveryLinks: Record<string, string> = {
  Siemens: "/control-center?source=siemens",
  Rheinmetall: "/control-center?source=rheinmetall",
  BWI: "/control-center?source=bwi",
};

export default function SourcesPage() {
  const liveSources = trackedSources.filter((s) => /live/i.test(s.status));
  const queuedSources = trackedSources.filter((s) => !/live/i.test(s.status));

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <PageHero
        variant="minimal"
        eyebrow="Sources"
        title="Mapa das fontes — o que está vivo e o que entra na próxima onda."
        metrics={[
          { label: "Total", value: `${trackedSources.length}`, tone: "light" },
          { label: "Live", value: `${liveSources.length}`, tone: "emerald" },
          { label: "Queued", value: `${queuedSources.length}`, tone: "amber" },
          { label: "Mode", value: "Ops", tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/control-center"
              className="rounded-full bg-slate-950 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              Abrir control center
            </Link>
            <Link
              href="/jobs"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver jobs
            </Link>
          </>
        }
      />

      <div className="grid grid gap-4">
        {/* Live */}
        <div className="rounded-[28px] border border-emerald-200/60 bg-gradient-to-b from-emerald-50/60 to-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Discovery live
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                Prontas para puxar vagas agora
              </h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">
              {liveSources.length} ativas
            </span>
          </div>

          <div className="space-y-3">
            {liveSources.map((source) => (
              <article
                key={source.company}
                className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">{source.company}</h3>
                    <p className="mt-0.5 text-[13px] text-slate-500">{source.strategy}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    live
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={liveDiscoveryLinks[source.company] ?? "/control-center"}
                    className="rounded-full bg-slate-950 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                  >
                    Abrir discovery
                  </Link>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Portal ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Queue */}
        <div className="rounded-[28px] border border-slate-200/60 bg-white/80 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.04)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Fila de expansão
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                Catalogados para próximos conectores
              </h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">
              {queuedSources.length} portais
            </span>
          </div>

          <div className="space-y-2">
            {queuedSources.map((source) => (
              <article
                key={source.company}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-slate-950">{source.company}</h3>
                  <p className="mt-0.5 text-[12px] text-slate-500 truncate">{source.strategy}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {source.status}
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] font-medium text-slate-400 transition hover:text-slate-700"
                  >
                    ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
