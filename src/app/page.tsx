import Link from "next/link";
import { candidateProfile, trackedSources } from "@/lib/profile";

const NAV_CARDS = [
  {
    href: "/control-center",
    label: "Control Center",
    desc: "Operar a vaga ativa — match, riscos, mensagem e status.",
    dark: true,
  },
  {
    href: "/jobs",
    label: "Jobs Explorer",
    desc: "Buscar, filtrar e inspecionar vagas do radar.",
    dark: false,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    desc: "Funil, lanes por status e prioridade do pipeline.",
    dark: false,
  },
] as const;

export default function Home() {
  const liveSources = trackedSources.filter((s) => /live/i.test(s.status));

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">

      {/* Hero — compacto, direto */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Private radar
            </span>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Argus — cockpit privado para job hunting.
            </h1>
            <p className="mt-2 text-[14px] leading-6 text-slate-500">
              Discovery real, score de aderência, recruiter message e pipeline operável em um lugar.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/control-center"
                style={{ background: "#0f172a", color: "#fff" }}
                className="rounded-full px-4 py-2 text-[13px] font-semibold transition hover:opacity-80"
              >
                Abrir Control Center
              </Link>
              <Link
                href="/jobs"
                style={{ border: "1px solid #e2e8f0", color: "#334155" }}
                className="rounded-full px-4 py-2 text-[13px] font-semibold transition hover:bg-slate-50"
              >
                Ver Jobs
              </Link>
            </div>
          </div>

          {/* Stats — compacto */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 lg:min-w-[220px]">
            {[
              { label: "Perfil", value: candidateProfile.name.split(" ")[0] },
              { label: "Live", value: `${liveSources.length} fontes` },
              { label: "Stack", value: `${candidateProfile.coreStack.length} techs` },
              { label: "Idiomas", value: candidateProfile.languages.join(", ") },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{s.label}</p>
                <p className="mt-0.5 text-[13px] font-semibold text-slate-800 truncate">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nav cards — 3 áreas principais */}
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {NAV_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={card.dark ? { background: "#0f172a", border: "1px solid #1e293b" } : { border: "1px solid #e2e8f0" }}
            className="group flex flex-col gap-2 rounded-2xl p-5 transition hover:opacity-90 bg-white"
          >
            <p
              style={{ color: card.dark ? "#38bdf8" : "#64748b" }}
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            >
              {card.dark ? "Operate" : card.href === "/jobs" ? "Explore" : "Pipeline"}
            </p>
            <p
              style={{ color: card.dark ? "#f8fafc" : "#0f172a" }}
              className="text-[16px] font-semibold"
            >
              {card.label}
            </p>
            <p
              style={{ color: card.dark ? "#94a3b8" : "#64748b" }}
              className="text-[13px] leading-5"
            >
              {card.desc}
            </p>
            <p
              style={{ color: card.dark ? "#38bdf8" : "#475569" }}
              className="mt-1 text-[12px] font-semibold transition group-hover:translate-x-0.5"
            >
              Acessar →
            </p>
          </Link>
        ))}
      </section>

      {/* Info strip — fontes live + stack em linha, sem cards pesados */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Fontes live</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {liveSources.map((s) => (
                <span key={s.company} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700">
                  {s.company}
                </span>
              ))}
              {trackedSources.filter((s) => !/live/i.test(s.status)).slice(0, 4).map((s) => (
                <span key={s.company} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] text-slate-500">
                  {s.company}
                </span>
              ))}
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] text-slate-400">
                +{trackedSources.length - liveSources.length - 4} catalogadas
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Stack do perfil</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {candidateProfile.coreStack.slice(0, 8).map((s) => (
                <span key={s} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] text-slate-600">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
