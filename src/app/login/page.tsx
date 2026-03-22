import { LoginForm } from "@/components/login-form";
import { isAuthConfigured } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const authConfigured = isAuthConfigured();
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/control-center";

  return (
    <div className="flex min-h-[calc(100vh-48px)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-sky-50 to-sky-100 text-sm font-bold text-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.10)]">
            A
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Private access
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Argus Intelligence
            </h1>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-slate-200/60 bg-white/95 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <p className="text-[13px] leading-6 text-slate-500">
            {authConfigured
              ? "Use a senha privada definida para a aplicação. O acesso fica protegido por sessão."
              : "Configure ARGUS_ACCESS_PASSWORD e ARGUS_SESSION_SECRET para ativar a proteção."}
          </p>
          <LoginForm authConfigured={authConfigured} nextPath={nextPath} />
        </div>

        {/* Status */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Auth {authConfigured ? "✓ configurado" : "⚠ pendente de configuração"}
        </p>
      </div>
    </div>
  );
}
