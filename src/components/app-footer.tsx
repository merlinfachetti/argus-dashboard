export function AppFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.68))]">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Argus Platform
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Portal privado para discovery de vagas, leitura de job description,
            score de aderencia e operacao de candidatura.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-700">
          <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5">
            Next.js
          </span>
          <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5">
            Prisma
          </span>
          <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5">
            Vercel
          </span>
          <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5">
            Siemens connector
          </span>
        </div>
      </div>
    </footer>
  );
}
