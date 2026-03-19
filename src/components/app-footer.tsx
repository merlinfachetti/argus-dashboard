export function AppFooter() {
  return (
    <footer className="mt-12 border-t border-slate-900/80 bg-slate-950 text-slate-300">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
            Argus Platform
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Portal privado para discovery de vagas, leitura de job description,
            score de aderencia e operacao de candidatura.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-200">
          <span className="rounded-full border border-slate-700 px-3 py-1">
            Next.js
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1">
            Prisma
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1">
            Vercel
          </span>
          <span className="rounded-full border border-slate-700 px-3 py-1">
            Siemens connector
          </span>
        </div>
      </div>
    </footer>
  );
}
