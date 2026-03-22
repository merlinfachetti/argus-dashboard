import { LoginForm } from "@/components/login-form";
import { PageHero } from "@/components/page-hero";
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
    <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <PageHero
        eyebrow="Private Access"
        title="Entre no portal privado antes de acessar o radar de vagas."
        description="O Argus agora suporta autenticação privada por senha para proteger o dashboard, o radar e as áreas de operação."
        metrics={[
          { label: "Mode", value: "Private", tone: "accent" },
          { label: "Auth", value: authConfigured ? "Ready" : "Pending", tone: "light" },
          { label: "App", value: "Argus", tone: "light" },
          { label: "Area", value: "Secure", tone: "dark" },
        ]}
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-300">
                Access gate
              </p>
              <p className="mt-3 text-2xl font-semibold">
                Protecao privada para o portal
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Status
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                {authConfigured
                  ? "As variaveis de auth ja estao configuradas e o login pode ser usado."
                  : "Defina ARGUS_ACCESS_PASSWORD e ARGUS_SESSION_SECRET para ativar a protecao privada."}
              </p>
            </div>
          </div>
        }
      />

      <section className="mx-auto w-full max-w-[34rem] rounded-[36px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.9))] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
          Login
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Acesso ao workspace privado
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Use a senha privada definida para a aplicação. Depois do login, o acesso ao app fica protegido por sessão.
        </p>

        <LoginForm authConfigured={authConfigured} nextPath={nextPath} />
      </section>
    </div>
  );
}
