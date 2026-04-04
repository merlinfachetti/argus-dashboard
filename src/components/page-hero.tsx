import type { CSSProperties, ReactNode } from "react";

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

function metricToneStyle(tone: HeroMetric["tone"] = "light"): CSSProperties {
  const map: Record<NonNullable<HeroMetric["tone"]>, CSSProperties> = {
    dark:    { background: "rgba(245,158,11,.15)", color: "var(--gold)", border: "1px solid rgba(245,158,11,.3)" },
    accent:  { background: "rgba(59,130,246,.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,.3)" },
    emerald: { background: "rgba(16,185,129,.1)", color: "#10b981", border: "1px solid rgba(16,185,129,.3)" },
    amber:   { background: "rgba(245,158,11,.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,.3)" },
    rose:    { background: "rgba(239,68,68,.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)" },
    light:   { background: "rgba(148,163,184,.08)", color: "var(--text)", border: "1px solid var(--border)" },
  };
  return map[tone];
}

// Variante padrão — para páginas operacionais com aside
function DefaultHero({ eyebrow, title, description, metrics, actions, aside }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[36px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(245,158,11,0.04),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(59,130,246,0.03),transparent_40%)]" />

      <div className="relative grid gap-0 xl:grid-cols-[1fr_340px]">
        {/* Left — content */}
        <div className="p-5 sm:p-7 xl:p-10" style={{ borderRight: "1px solid var(--border)" }}>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ background: "rgba(148,163,184,.08)", color: "var(--muted)", border: "1px solid var(--border)" }}>
            {eyebrow}
          </div>

          <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-[2.2rem] sm:leading-[1.1]" style={{ color: "var(--text)" }}>
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-xl text-[15px] leading-7" style={{ color: "var(--dim)" }}>
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
                  style={metricToneStyle(metric.tone)}
                  className="rounded-2xl p-4"
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
          <div className="flex flex-col p-8 xl:rounded-r-[36px]" style={{ background: "var(--surf)", color: "var(--text)" }}>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-[340px] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.06),transparent_40%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.04),transparent_40%)] xl:rounded-r-[36px]" />
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
    <section className="pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ background: "rgba(148,163,184,.08)", color: "var(--muted)", border: "1px solid var(--border)" }}>
        {eyebrow}
      </div>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-xl text-[14px] leading-7" style={{ color: "var(--dim)" }}>
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
              style={metricToneStyle(metric.tone)}
              className="rounded-xl px-4 py-2.5"
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
    <section className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
          {title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {metrics?.map((metric) => (
          <div
            key={`${metric.label}-${metric.value}`}
            style={metricToneStyle(metric.tone)}
            className="rounded-xl px-3 py-2"
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
