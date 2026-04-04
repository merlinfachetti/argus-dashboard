import { LoginForm } from "@/components/login-form";
import { isAuthConfigured } from "@/lib/auth";
import { t as i18n } from "@/lib/i18n/strings";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const t = (key: string) => i18n(key, "en");
  const authConfigured = isAuthConfigured();
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/control-center";

  const steps = [
    t("login.step1"),
    t("login.step2"),
    t("login.step3"),
    t("login.step4"),
  ];

  return (
    <div className="flex min-h-[calc(100vh-48px)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--gold)" }}>
            A
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
              {t("login.privateAccess")}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              {t("login.appName")}
            </h1>
          </div>
        </div>

        {/* Not-configured warning banner */}
        {!authConfigured && (
          <div
            className="mb-4 rounded-2xl px-5 py-3 text-[12px] leading-5"
            style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.25)", color: "var(--gold)" }}
          >
            {t("login.notConfiguredWarning")}
          </div>
        )}

        {/* Card */}
        <div className="rounded-[28px] p-7" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-[13px] leading-6" style={{ color: "var(--dim)" }}>
            {authConfigured ? t("login.description") : t("login.configureEnv")}
          </p>
          <LoginForm authConfigured={authConfigured} nextPath={nextPath} />
        </div>

        {/* Status pill */}
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-[11px]" style={{ color: "var(--dim)" }}>
            {authConfigured ? t("login.authConfigured") : t("login.authPending")}
          </p>
          <p className="text-[10px]" style={{ color: "var(--dim)", opacity: 0.6 }}>
            {t("login.sessionInfo")}
          </p>
        </div>

        {/* ── How it works — step-by-step guide ──────────────────────── */}
        <div
          className="mt-8 rounded-2xl p-5"
          style={{ background: "var(--surf)", border: "1px solid var(--border)" }}
        >
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            {t("login.howItWorks")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: i === 3 ? "rgba(245,158,11,.15)" : "rgba(148,163,184,.08)",
                    border: i === 3 ? "1px solid var(--gold)" : "1px solid var(--border)",
                    color: i === 3 ? "var(--gold)" : "var(--dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  {i + 1}
                </span>
                <p className="text-[12px] leading-5" style={{ color: "var(--muted)" }}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[11px]" style={{ color: "var(--dim)", opacity: 0.5 }}>
            {t("login.singlePassword")}
          </p>
        </div>
      </div>
    </div>
  );
}
