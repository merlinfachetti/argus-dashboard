import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getOperationalReadiness } from "@/lib/ops-readiness";

export const dynamic = "force-dynamic";


function statusBadgeStyle(status: "ready" | "warning" | "blocked"): React.CSSProperties {
  const map = {
    ready:   { background: "rgba(16,185,129,.15)", color: "#10b981", border: "1px solid rgba(16,185,129,.3)" },
    warning: { background: "rgba(245,158,11,.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,.3)" },
    blocked: { background: "rgba(239,68,68,.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)" },
  };
  return map[status];
}

function cardToneStyle(status: "ready" | "warning" | "blocked"): React.CSSProperties {
  const map = {
    ready:   { background: "var(--card)", border: "1px solid rgba(16,185,129,.25)" },
    warning: { background: "var(--card)", border: "1px solid rgba(245,158,11,.25)" },
    blocked: { background: "var(--card)", border: "1px solid rgba(239,68,68,.25)" },
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
              className="rounded-full px-4 py-2 text-[13px] font-semibold transition"
              style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              Ver sources
            </Link>
            <Link
              href="/control-center"
              className="rounded-full px-4 py-2 text-[13px] font-semibold transition"
              style={{ background: "transparent", color: "var(--dim)", border: "1px solid var(--border)" }}
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
            style={cardToneStyle(check.status)}
            className="rounded-[24px] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  {check.label}
                </p>
                <h2 className="mt-1.5 text-[17px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                  {check.summary}
                </h2>
              </div>
              <span
                style={statusBadgeStyle(check.status)}
                className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
              >
                {check.status}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-6" style={{ color: "var(--dim)" }}>
              {check.detail}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
