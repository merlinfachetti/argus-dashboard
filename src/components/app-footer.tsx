export function AppFooter() {
  return (
    <footer className="mt-20 border-t border-slate-950/[0.06]">
      <div className="mx-auto flex w-full max-w-[92rem] items-center justify-between gap-4 px-6 py-5 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-gradient-to-br from-slate-200 via-sky-100 to-sky-200 text-[10px] font-bold text-slate-900">
            A
          </span>
          <span className="text-[12px] font-medium text-slate-500">
            Argus Intelligence — Private job radar
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>Next.js · Prisma · Vercel</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            v2
          </span>
        </div>
      </div>
    </footer>
  );
}
