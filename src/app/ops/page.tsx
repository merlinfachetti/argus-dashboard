import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getOperationalReadiness } from "@/lib/ops-readiness";

export const dynamic = "force-dynamic";


function statusBadgeStyle(status: "ready" | "warning" | "blocked"): React.CSSProperties {
  const map = {
    ready:   { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" },
    warning: { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" },
    blocked: { background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" },
  };
  return map[status];
}

function cardToneStyle(status: "ready" | "warning" | "blocked"): React.CSSProperties {
  const map = {
    ready:   { background: "linear-gradient(180deg,#f0fdf4,#fff)", border: "1px solid #bbf7d0" },
    warning: { background: "linear-gradient(180deg,#fffbeb,#fff)", border: "1px solid #fde68a" },
    blocked: { background: "linear-gradient(180deg,#fff1f2,#fff)", border: "1px solid #fecdd3" },
  };
  return map[status];
}

export default async function OpsPage() {
  const readiness = await getOperationalReadiness();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <PageHero
        variant="minimal"
        eyebrow="Ops"
        title="Readiness — what's live and what's blocking full production."
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
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-900 transition hover:bg-slate-50"
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

      <div className="grid gap-3 sm:grid-cols-2">
        {readiness.checks.map((check) => (
          <article
            key={check.id}
            style={cardToneStyle(check.status)} className="rounded-[24px] p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)]"
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
                style={statusBadgeStyle(check.status)} className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
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
