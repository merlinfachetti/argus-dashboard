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
    return "border-sky-200 bg-sky-50 text-slate-950";
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
    <section className="relative overflow-hidden rounded-[40px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,240,0.9)_40%,rgba(239,246,255,0.92))] p-8 shadow-[0_30px_120px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10 xl:p-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.10),transparent_28%)]" />

      <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">
            {eyebrow}
            <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] tracking-[0.24em] text-white">
              Argus
            </span>
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl xl:text-[3.75rem] xl:leading-[1.02]">
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
                  className={`rounded-[28px] border p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)] ${metricToneClass(metric.tone)}`}
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
          <div className="relative rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
