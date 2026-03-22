import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getOperationalReadiness } from "@/lib/ops-readiness";

function statusBadge(status: "ready" | "warning" | "blocked") {
  const map = {
    ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    blocked: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return map[status];
}

function cardTone(status: "ready" | "warning" | "blocked") {
  const map = {
    ready: "border-emerald-200/60 bg-gradient-to-b from-emerald-50/50 to-white",
    warning: "border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white",
    blocked: "border-rose-200/60 bg-gradient-to-b from-rose-50/50 to-white",
  };
  return map[status];
}

export default async function OpsPage() {
  const readiness = await getOperationalReadiness();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        variant="minimal"
        eyebrow="Ops"
        title="Readiness — o que está pronto e o que ainda bloqueia produção."
        metrics={[
          { label: "Ready", value: `${readiness.readyCount}`, tone: "emerald" },
          { label: "Warning", value: `${readiness.warningCount}`, tone: "amber" },
          { label: "Blocked", value: `${readiness.blockedCount}`, tone: "rose" },
          { label: "Mode", value: "Readiness", tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/sources"
              className="rounded-full bg-slate-950 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              Ver sources
            </Link>
            <Link
              href="/control-center"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar ao app
            </Link>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-2">
        {readiness.checks.map((check) => (
          <article
            key={check.id}
            className={`rounded-[24px] border p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] ${cardTone(check.status)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {check.label}
                </p>
                <h2 className="mt-1.5 text-[17px] font-semibold tracking-tight text-slate-950">
                  {check.summary}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${statusBadge(check.status)}`}
              >
                {check.status}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-600">
              {check.detail}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
