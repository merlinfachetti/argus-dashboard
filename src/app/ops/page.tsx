import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getOperationalReadiness } from "@/lib/ops-readiness";

function cardTone(status: "ready" | "warning" | "blocked") {
  if (status === "ready") {
    return "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(255,255,255,0.92))]";
  }

  if (status === "warning") {
    return "border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.92))]";
  }

  return "border-rose-200 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,255,255,0.92))]";
}

export default async function OpsPage() {
  const readiness = await getOperationalReadiness();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Ops"
        title="Uma leitura objetiva do quanto o Argus está realmente pronto para operar em produção."
        description="Esta página transforma os principais blocos do produto em checks claros: auth, banco, discovery real, digest e readiness operacional."
        metrics={[
          { label: "Ready", value: `${readiness.readyCount}`, tone: "accent" },
          { label: "Warning", value: `${readiness.warningCount}`, tone: "light" },
          { label: "Blocked", value: `${readiness.blockedCount}`, tone: "light" },
          { label: "Mode", value: "Readiness", tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/sources"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Abrir sources
            </Link>
            <Link
              href="/control-center"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Voltar ao app
            </Link>
          </>
        }
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Readiness board
              </p>
              <p className="mt-3 text-2xl font-semibold">
                O que ja esta forte e o que ainda bloqueia orgulho total
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Uso ideal
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Revisar essa pagina antes de deploy e antes de chamar o produto de producao pronta.
              </p>
            </div>
          </div>
        }
      />

      <section className="grid gap-5 xl:grid-cols-2">
        {readiness.checks.map((check) => (
          <article
            key={check.id}
            className={`rounded-[32px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] ${cardTone(
              check.status,
            )}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {check.label}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {check.summary}
                </h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">
                {check.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{check.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
