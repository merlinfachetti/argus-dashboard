import Link from "next/link";
import { DigestActions } from "@/components/digest-actions";
import { PageHero } from "@/components/page-hero";
import { buildDailyDigestPreview } from "@/lib/daily-digest";
import { t as i18n } from "@/lib/i18n/strings";

export const dynamic = "force-dynamic";


export default async function DigestsPage() {
  const t = (key: string) => i18n(key, "en");
  const digest = await buildDailyDigestPreview();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <PageHero
        variant="minimal"
        eyebrow="Digests"
        title="Morning digest — radar as daily operating routine."
        description={t("digests.description")}
        metrics={[
          { label: t("digests.items"), value: `${digest.items.length}`, tone: "accent" },
          { label: t("digests.highPriority"), value: `${digest.topPriorityCount}`, tone: "emerald" },
          { label: t("digests.actionQueue"), value: `${digest.actionQueueCount}`, tone: "light" },
          { label: "Mode", value: "Digest", tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/ops"
              className="rounded-full px-4 py-2 text-[13px] font-semibold transition"
              style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              {t("digests.viewOps")}
            </Link>
            <Link
              href="/jobs"
              className="rounded-full px-4 py-2 text-[13px] font-semibold transition"
              style={{ background: "transparent", color: "var(--dim)", border: "1px solid var(--border)" }}
            >
              {t("digests.backToJobs")}
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[1fr_300px]">
        {/* Preview do digest */}
        <article className="rounded-[28px] p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            Subject
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            {digest.subject}
          </h2>
          <p className="mt-3 text-[13px] leading-6" style={{ color: "var(--dim)" }}>{digest.intro}</p>
          <p className="mt-1 text-[13px] leading-6" style={{ color: "var(--dim)" }}>{digest.summary}</p>

          <div className="mt-5 space-y-2.5">
            {digest.items.length > 0 ? (
              digest.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl p-4"
                  style={{ background: "var(--surf)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>{item.title}</h3>
                      <p className="mt-0.5 text-[12px]" style={{ color: "var(--dim)" }}>
                        {item.company} · {item.location}
                      </p>
                      <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--muted)" }}>{item.reason}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: "rgba(59,130,246,.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,.3)" }}>
                        {item.score}%
                      </div>
                      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                        {item.verdict}
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: "var(--dim)" }}>{item.status}</p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl px-5 py-6 text-[13px] leading-6" style={{ background: "var(--surf)", border: "1px dashed var(--border)", color: "var(--dim)" }}>
                {t("digests.emptyState")}
              </div>
            )}
          </div>
        </article>

        {/* Sidebar de status */}
        <div className="space-y-3">
          <article
            className="rounded-[24px] p-5"
            style={digest.emailConfigured
              ? { background: "var(--card)", border: "1px solid rgba(16,185,129,.3)" }
              : { background: "var(--card)", border: "1px solid var(--border)" }
            }
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Email delivery
            </p>
            <h2 className="mt-2 text-[15px] font-semibold" style={{ color: "var(--text)" }}>
              {digest.emailConfigured ? t("digests.emailConfigured") : t("digests.emailPending")}
            </h2>
            <p className="mt-2 text-[12px] leading-6" style={{ color: "var(--dim)" }}>
              Configure <code style={{ background: "var(--surf)", padding: "1px 6px", borderRadius: "4px", fontSize: "11px", color: "var(--muted)" }}>RESEND_API_KEY</code>,{" "}
              <code style={{ background: "var(--surf)", padding: "1px 6px", borderRadius: "4px", fontSize: "11px", color: "var(--muted)" }}>ARGUS_DIGEST_FROM_EMAIL</code> e{" "}
              <code style={{ background: "var(--surf)", padding: "1px 6px", borderRadius: "4px", fontSize: "11px", color: "var(--muted)" }}>ARGUS_DIGEST_TO_EMAIL</code>.
            </p>
          </article>

          <article
            className="rounded-[24px] p-5"
            style={digest.cronConfigured
              ? { background: "var(--card)", border: "1px solid rgba(16,185,129,.3)" }
              : { background: "var(--card)", border: "1px solid var(--border)" }
            }
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Scheduler
            </p>
            <h2 className="mt-2 text-[15px] font-semibold" style={{ color: "var(--text)" }}>
              {digest.cronConfigured ? t("digests.cronMapped") : t("digests.cronNotFound")}
            </h2>
            <p className="mt-2 text-[12px] leading-6" style={{ color: "var(--dim)" }}>
              A rota usa <code style={{ background: "var(--surf)", padding: "1px 6px", borderRadius: "4px", fontSize: "11px", color: "var(--muted)" }}>CRON_SECRET</code> e roda diariamente em UTC sem expor o endpoint.
            </p>
          </article>

          <article className="rounded-[24px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Profile source
            </p>
            <h2 className="mt-2 text-[15px] font-semibold" style={{ color: "var(--text)" }}>
              {digest.profileSource === "database" ? t("digests.profileDB") : t("digests.profileFallback")}
            </h2>
            <p className="mt-2 text-[12px] leading-6" style={{ color: "var(--dim)" }}>
              O digest respeita o perfil persistido no servidor, não só o estado local.
            </p>
          </article>

          <DigestActions />
        </div>
      </div>
    </div>
  );
}
