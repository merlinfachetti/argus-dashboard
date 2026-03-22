import type { ReactNode } from "react";

type HeroMetric = {
  label: string;
  value: string;
  tone?: "dark" | "light" | "accent";
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  metrics?: HeroMetric[];
  actions?: ReactNode;
  aside?: ReactNode;
};

function metricToneClass(tone: HeroMetric["tone"] = "light") {
  if (tone === "dark") {
    return "border-slate-800 bg-slate-950 text-white";
  }

  if (tone === "accent") {
    return "border-sky-200 bg-[linear-gradient(180deg,rgba(224,242,254,0.96),rgba(255,255,255,0.96))] text-slate-950";
  }

  return "border-white/70 bg-white/88 text-slate-950";
}

export function PageHero({
  eyebrow,
  title,
  description,
  metrics = [],
  actions,
  aside,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[44px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,240,0.88)_38%,rgba(239,246,255,0.92))] p-8 shadow-[0_36px_140px_rgba(15,23,42,0.09)] backdrop-blur sm:p-10 xl:p-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(249,115,22,0.14),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.18),transparent_45%)]" />
      <div className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-300/20 blur-3xl" />

      <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            {eyebrow}
            <span className="rounded-full bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-2 py-0.5 text-[10px] tracking-[0.24em] text-white">
              Intelligence
            </span>
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl xl:text-[4rem] xl:leading-[0.98]">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            {description}
          </p>

          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}

          {metrics.length > 0 ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={`${metric.label}-${metric.value}`}
                  className={`rounded-[30px] border p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] ${metricToneClass(metric.tone)}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-current/60">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {aside ? (
          <div className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(7,16,30,0.98),rgba(15,23,42,0.96),rgba(30,41,59,0.96))] p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.20)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_26%)]" />
            <div className="relative">{aside}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
