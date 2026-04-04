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

  return (
    <div className="flex min-h-[calc(100vh-48px)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[400px]">
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

        {/* Card */}
        <div className="rounded-[28px] p-7" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-[13px] leading-6" style={{ color: "var(--dim)" }}>
            {authConfigured ? t("login.description") : t("login.configureEnv")}
          </p>
          <LoginForm authConfigured={authConfigured} nextPath={nextPath} />
        </div>

        {/* Status */}
        <p className="mt-4 text-center text-[11px]" style={{ color: "var(--dim)" }}>
          {authConfigured ? t("login.authConfigured") : t("login.authPending")}
        </p>
      </div>
    </div>
  );
}
