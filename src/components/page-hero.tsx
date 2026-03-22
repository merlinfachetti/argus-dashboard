import type { ReactNode } from "react";

type HeroMetric = {
  label: string;
  value: string;
  tone?: "dark" | "light" | "accent" | "emerald" | "amber" | "rose";
};

type PageHeroVariant = "default" | "minimal" | "dark" | "compact";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  metrics?: HeroMetric[];
  actions?: ReactNode;
  aside?: ReactNode;
  variant?: PageHeroVariant;
};

function metricToneClass(tone: HeroMetric["tone"] = "light") {
  const map: Record<NonNullable<HeroMetric["tone"]>, string> = {
    dark: "border-slate-800 bg-slate-950 text-white",
    accent: "border-sky-200/80 bg-gradient-to-b from-sky-50 to-white text-slate-950",
    emerald: "border-emerald-200/80 bg-gradient-to-b from-emerald-50 to-white text-slate-950",
    amber: "border-amber-200/80 bg-gradient-to-b from-amber-50 to-white text-slate-950",
    rose: "border-rose-200/80 bg-gradient-to-b from-rose-50 to-white text-slate-950",
    light: "border-slate-200/80 bg-white/90 text-slate-950",
  };
  return map[tone];
}

// Variante padrão — para páginas operacionais com aside
function DefaultHero({ eyebrow, title, description, metrics, actions, aside }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-slate-200/60 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur-sm">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.07),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(249,115,22,0.05),transparent_40%)]" />

      <div className="relative grid gap-0 xl:grid-cols-[1fr_340px]">
        {/* Left — content */}
        <div className="border-r border-slate-200/60 p-8 xl:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {eyebrow}
          </div>

          <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2.2rem] sm:leading-[1.1]">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-500">
              {description}
            </p>
          )}

          {actions && (
            <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div>
          )}

          {metrics && metrics.length > 0 && (
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={`${metric.label}-${metric.value}`}
                  className={`rounded-2xl border p-4 ${metricToneClass(metric.tone)}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-50">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — aside */}
        {aside && (
          <div className="flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 p-8 text-white xl:rounded-r-[36px]">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-[340px] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_bottom,rgba(249,115,22,0.08),transparent_40%)] xl:rounded-r-[36px]" />
            <div className="relative flex-1">{aside}</div>
          </div>
        )}
      </div>
    </section>
  );
}

// Variante minimal — sem aside, para páginas de conteúdo simples
function MinimalHero({ eyebrow, title, description, metrics, actions }: PageHeroProps) {
  return (
    <section className="border-b border-slate-200/60 pb-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {eyebrow}
      </div>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-xl text-[14px] leading-7 text-slate-500">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        )}
      </div>
      {metrics && metrics.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <div
              key={`${metric.label}-${metric.value}`}
              className={`rounded-xl border px-4 py-2.5 ${metricToneClass(metric.tone)}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-40">
                {metric.label}
              </p>
              <p className="mt-0.5 text-lg font-semibold tracking-tight">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Variante compact — apenas eyebrow + título + ações numa linha
function CompactHero({ eyebrow, title, actions, metrics }: PageHeroProps) {
  return (
    <section className="flex flex-col gap-4 border-b border-slate-200/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {metrics?.map((metric) => (
          <div
            key={`${metric.label}-${metric.value}`}
            className={`rounded-xl border px-3 py-2 ${metricToneClass(metric.tone)}`}
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-40">
              {metric.label}
            </p>
            <p className="mt-0.5 text-base font-semibold">{metric.value}</p>
          </div>
        ))}
        {actions}
      </div>
    </section>
  );
}

export function PageHero(props: PageHeroProps) {
  const { variant = "default" } = props;

  if (variant === "minimal") return <MinimalHero {...props} />;
  if (variant === "compact") return <CompactHero {...props} />;
  return <DefaultHero {...props} />;
}
