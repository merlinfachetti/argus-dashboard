import Link from "next/link";
import { DigestActions } from "@/components/digest-actions";
import { PageHero } from "@/components/page-hero";
import { buildDailyDigestPreview } from "@/lib/daily-digest";

function cardTone(active: boolean) {
  return active
    ? "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(255,255,255,0.92))]"
    : "border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.92))]";
}

export default async function DigestsPage() {
  const digest = await buildDailyDigestPreview();

  return (
    <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Digests"
        title="O resumo diário que transforma o radar em uma rotina realmente operável."
        description="Esta área mostra exatamente o que será consolidado de manhã, o quanto o ciclo já está pronto e permite testar persistência e entrega por email."
        metrics={[
          { label: "Itens", value: `${digest.items.length}`, tone: "accent" },
          { label: "Alta prioridade", value: `${digest.topPriorityCount}`, tone: "light" },
          { label: "Fila de ação", value: `${digest.actionQueueCount}`, tone: "light" },
          { label: "Mode", value: "Digest", tone: "dark" },
        ]}
        actions={
          <>
            <Link
              href="/ops"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Abrir ops
            </Link>
            <Link
              href="/jobs"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Voltar para jobs
            </Link>
          </>
        }
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Morning routine
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Preview real do que chega por email na primeira hora do dia
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Status
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                {digest.blockedReason ?? "Motor de digest pronto para preview, persistência e envio controlado."}
              </p>
            </div>
          </div>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Subject
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {digest.subject}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{digest.intro}</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{digest.summary}</p>

          <div className="mt-6 space-y-3">
            {digest.items.length > 0 ? (
              digest.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.company} · {item.location}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {item.reason}
                      </p>
                    </div>
                    <div className="text-left lg:text-right">
                      <div className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-slate-950">
                        {item.score}%
                      </div>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {item.verdict}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{item.status}</p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-6 text-sm leading-7 text-slate-500">
                Assim que o banco estiver conectado e o radar persistido tiver vagas, o preview do digest aparece aqui automaticamente.
              </div>
            )}
          </div>
        </article>

        <div className="space-y-5">
          <article className={`rounded-[32px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] ${cardTone(digest.emailConfigured)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Email delivery
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {digest.emailConfigured ? "Resend pronto para envio" : "Entrega por email ainda precisa de envs"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Defina `RESEND_API_KEY`, `ARGUS_DIGEST_FROM_EMAIL` e `ARGUS_DIGEST_TO_EMAIL` para disparar o digest matinal para a caixa certa.
            </p>
          </article>

          <article className={`rounded-[32px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] ${cardTone(digest.cronConfigured)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Scheduler
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {digest.cronConfigured ? "Cron da Vercel mapeado" : "Cron ainda nao encontrado no projeto"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              A rota de cron usa `CRON_SECRET` e foi preparada para rodar todos os dias em UTC sem deixar o endpoint publico aberto.
            </p>
          </article>

          <article className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Profile source
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {digest.profileSource === "database" ? "Documentos vindo do banco" : "Fallback no perfil base do projeto"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              O digest agora respeita o perfil persistido no servidor, não só o estado local do navegador.
            </p>
          </article>

          <DigestActions />
        </div>
      </section>
    </div>
  );
}
