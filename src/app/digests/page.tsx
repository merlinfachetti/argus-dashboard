import Link from "next/link";
import { DigestActions } from "@/components/digest-actions";
import { PageHero } from "@/components/page-hero";
import { buildDailyDigestPreview } from "@/lib/daily-digest";

export default async function DigestsPage() {
  const digest = await buildDailyDigestPreview();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <PageHero
        variant="minimal"
        eyebrow="Digests"
        title="Morning digest — radar as daily operating routine."
        description="Preview do que será consolidado amanhã cedo, status do envio por email e controle do cron."
        metrics={[
          { label: "Itens", value: `${digest.items.length}`, tone: "accent" },
          { label: "Alta prioridade", value: `${digest.topPriorityCount}`, tone: "emerald" },
          { label: "Fila de ação", value: `${digest.actionQueueCount}`, tone: "light" },
          { label: "Mode", value: "Digest", tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/ops"
              className="rounded-full bg-slate-950 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              Ver ops
            </Link>
            <Link
              href="/jobs"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar para jobs
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        {/* Preview do digest */}
        <article className="rounded-[28px] border border-slate-200/60 bg-white/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Subject
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {digest.subject}
          </h2>
          <p className="mt-3 text-[13px] leading-6 text-slate-500">{digest.intro}</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-500">{digest.summary}</p>

          <div className="mt-5 space-y-2.5">
            {digest.items.length > 0 ? (
              digest.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-0.5 text-[12px] text-slate-500">
                        {item.company} · {item.location}
                      </p>
                      <p className="mt-2 text-[13px] leading-6 text-slate-600">{item.reason}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[13px] font-bold text-sky-800">
                        {item.score}%
                      </div>
                      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {item.verdict}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{item.status}</p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-6 text-[13px] leading-6 text-slate-400">
                Assim que o banco estiver conectado e o radar tiver vagas, o preview do digest aparece aqui automaticamente.
              </div>
            )}
          </div>
        </article>

        {/* Sidebar de status */}
        <div className="space-y-3">
          <article
            className={[
              "rounded-[24px] border p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)]",
              digest.emailConfigured
                ? "border-emerald-200/60 bg-gradient-to-b from-emerald-50/50 to-white"
                : "border-slate-200/60 bg-white/90",
            ].join(" ")}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Email delivery
            </p>
            <h2 className="mt-2 text-[15px] font-semibold text-slate-950">
              {digest.emailConfigured ? "Resend configurado" : "Envio pendente de configuração"}
            </h2>
            <p className="mt-2 text-[12px] leading-6 text-slate-500">
              Configure <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">RESEND_API_KEY</code>,{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">ARGUS_DIGEST_FROM_EMAIL</code> e{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">ARGUS_DIGEST_TO_EMAIL</code>.
            </p>
          </article>

          <article
            className={[
              "rounded-[24px] border p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)]",
              digest.cronConfigured
                ? "border-emerald-200/60 bg-gradient-to-b from-emerald-50/50 to-white"
                : "border-slate-200/60 bg-white/90",
            ].join(" ")}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Scheduler
            </p>
            <h2 className="mt-2 text-[15px] font-semibold text-slate-950">
              {digest.cronConfigured ? "Cron mapeado na Vercel" : "Cron ainda não encontrado"}
            </h2>
            <p className="mt-2 text-[12px] leading-6 text-slate-500">
              A rota usa <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">CRON_SECRET</code> e roda diariamente em UTC sem expor o endpoint.
            </p>
          </article>

          <article className="rounded-[24px] border border-slate-200/60 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Profile source
            </p>
            <h2 className="mt-2 text-[15px] font-semibold text-slate-950">
              {digest.profileSource === "database" ? "Perfil vindo do banco" : "Fallback no perfil base"}
            </h2>
            <p className="mt-2 text-[12px] leading-6 text-slate-500">
              O digest respeita o perfil persistido no servidor, não só o estado local.
            </p>
          </article>

          <DigestActions />
        </div>
      </div>
    </div>
  );
}
