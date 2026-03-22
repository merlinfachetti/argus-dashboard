export function AppFooter() {
  return (
    <footer className="mt-24 border-t border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.78))]">
      <div className="mx-auto grid w-full max-w-[92rem] gap-6 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-10">
        <div className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Argus Platform
          </p>
          <p className="mt-4 max-w-2xl text-lg font-semibold tracking-tight text-slate-950">
            Um cockpit privado para transformar hunting disperso em pipeline operável e repetível.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Discovery real, leitura estruturada, score de aderência, prioridade e rotina de candidatura em uma experiência única.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Core stack
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-700">
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
              Next.js
            </span>
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
              Prisma
            </span>
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
              Vercel
            </span>
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
              Postgres
            </span>
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5">
              Resend
            </span>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-900/80 bg-[linear-gradient(180deg,rgba(8,17,31,1),rgba(15,23,42,0.98))] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
            Product thesis
          </p>
          <p className="mt-4 text-lg font-semibold tracking-tight">
            Mais signal, menos fricção, melhor timing.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            O valor do Argus está em descobrir antes, priorizar melhor e reduzir o trabalho manual repetitivo do processo inteiro.
          </p>
        </div>
      </div>
    </footer>
  );
}
