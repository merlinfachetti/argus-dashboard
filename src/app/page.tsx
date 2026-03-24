import Image from "next/image";
import Link from "next/link";
import { candidateProfile, trackedSources } from "@/lib/profile";

const NAV_CARDS = [
  {
    href: "/control-center",
    label: "Control Center",
    desc: "Vaga ativa — match, gaps, mensagem e aplicação.",
    cta: "Operar agora",
    dark: true,
  },
  {
    href: "/jobs",
    label: "Jobs Radar",
    desc: "Buscar, filtrar e priorizar vagas do mercado.",
    cta: "Explorar vagas",
    dark: false,
  },
  {
    href: "/dashboard",
    label: "Pipeline",
    desc: "Funil, urgência e gargalos na sua candidatura.",
    cta: "Ver pipeline",
    dark: false,
  },
] as const;

export default function Home() {
  const liveSources = trackedSources.filter((s) => /live/i.test(s.status));

  return (
    <div className="mx-auto w-full max-w-[92rem] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">

      {/* Hero — identidade Argus */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 flex items-center gap-2">
              <Image
                src="/logo-argus.png"
                alt="Argus"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
                Argus — vigilância total, decisão precisa
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Seu cockpit privado de job hunting.
            </h1>
            <p className="mt-2 text-[14px] leading-6 text-slate-500">
              {liveSources.length} fontes monitoradas em tempo real. Match calculado contra o seu perfil.
              Cada vaga com um caminho claro até a aplicação.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/control-center"
                style={{ background: "#0f172a", color: "#fff" }}
                className="rounded-full px-5 py-2.5 text-[13px] font-bold transition hover:opacity-80"
              >
                Abrir Control Center
              </Link>
              <Link
                href="/jobs"
                style={{ border: "1px solid #e2e8f0", color: "#334155" }}
                className="rounded-full px-4 py-2.5 text-[13px] font-semibold transition hover:bg-slate-50"
              >
                Ver vagas do radar
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 lg:min-w-[200px]">
            {[
              { label: "Fontes live", value: `${liveSources.length}` },
              { label: "Stack", value: `${candidateProfile.coreStack.length} techs` },
              { label: "Idiomas", value: candidateProfile.languages.slice(0, 2).join(", ") },
              { label: "Seniority", value: "Senior" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{s.label}</p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nav cards */}
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {NAV_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={card.dark ? { background: "#0f172a", border: "1px solid #1e293b" } : { border: "1px solid #e2e8f0" }}
            className="group flex flex-col gap-2 rounded-2xl bg-white p-5 transition hover:opacity-90"
          >
            <p style={{ color: card.dark ? "#94a3b8" : "#64748b" }} className="text-[11px] font-semibold uppercase tracking-[0.2em]">
              {card.dark ? "Operate" : card.href === "/jobs" ? "Discover" : "Track"}
            </p>
            <p style={{ color: card.dark ? "#f8fafc" : "#0f172a" }} className="text-[16px] font-semibold">
              {card.label}
            </p>
            <p style={{ color: card.dark ? "#94a3b8" : "#64748b" }} className="text-[13px] leading-5">
              {card.desc}
            </p>
            <p style={{ color: card.dark ? "#38bdf8" : "#0ea5e9" }} className="mt-auto text-[12px] font-bold transition group-hover:translate-x-0.5">
              {card.cta} →
            </p>
          </Link>
        ))}
      </section>

      {/* Fontes live — strip informativo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                {liveSources.length} fontes ativas
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {liveSources.map((s) => (
                <Link
                  key={s.company}
                  href="/sources"
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  {s.company}
                </Link>
              ))}
              {trackedSources.filter((s) => !/live/i.test(s.status)).slice(0, 3).map((s) => (
                <span key={s.company} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] text-slate-400">
                  {s.company}
                </span>
              ))}
              <Link href="/sources" className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] text-slate-400 hover:text-slate-600">
                +{trackedSources.length - liveSources.length - 3} catalogadas →
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Stack do perfil</p>
            <div className="flex flex-wrap gap-1">
              {candidateProfile.coreStack.slice(0, 6).map((s) => (
                <Link
                  key={s}
                  href={`/jobs?q=${encodeURIComponent(s)}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
