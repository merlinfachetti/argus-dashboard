import Image from "next/image";
import Link from "next/link";
import { candidateProfile, trackedSources } from "@/lib/profile";

const NAV_CARDS = [
  {
    href: "/control-center",
    label: "Control Center",
    eyebrow: "Operate",
    desc: "Vaga ativa — match, gaps, mensagem e aplicação.",
    cta: "Operar agora",
    accent: true,
  },
  {
    href: "/jobs",
    label: "Jobs Radar",
    eyebrow: "Discover",
    desc: "Buscar, filtrar e priorizar vagas do mercado.",
    cta: "Explorar vagas",
    accent: false,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    eyebrow: "Track",
    desc: "Funil, urgência e gargalos na sua candidatura.",
    cta: "Ver pipeline",
    accent: false,
  },
] as const;

export default function Home() {
  const liveSources = trackedSources.filter((s) => /live/i.test(s.status));

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "14px",
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ maxWidth: "520px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Image
              src="/logo-argus.png"
              alt="Argus"
              width={28}
              height={28}
              style={{ width: "28px", height: "28px", objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }}
              priority
            />
            <span style={{ color: "var(--dim)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>
              Argus — vigilância total, decisão precisa
            </span>
          </div>
          <h1 style={{ color: "var(--text)", fontSize: "22px", fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>
            Seu cockpit privado de job hunting.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 20px" }}>
            {liveSources.length} fontes monitoradas em tempo real. Match calculado contra o seu perfil.
            Cada vaga com um caminho claro até a aplicação.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <Link
              href="/control-center"
              style={{
                background: "var(--gold)",
                color: "#020810",
                borderRadius: "6px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Abrir Control Center
            </Link>
            <Link
              href="/jobs"
              style={{
                background: "transparent",
                border: "1px solid var(--border-l)",
                color: "var(--muted)",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Ver vagas do radar
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", minWidth: "200px" }}>
          {[
            { label: "Fontes live", value: `${liveSources.length}` },
            { label: "Stack", value: `${candidateProfile.coreStack.length} techs` },
            { label: "Idiomas", value: candidateProfile.languages.slice(0, 2).join(", ") },
            { label: "Seniority", value: "Senior" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "var(--surf)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <div style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: "4px" }}>
                {s.label}
              </div>
              <div style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nav cards ────────────────────────────────────────────────────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "14px" }}>
        {NAV_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              background: card.accent ? `linear-gradient(135deg, var(--card-alt), var(--card))` : "var(--card)",
              border: card.accent ? `1px solid var(--gold)` : "1px solid var(--border)",
              borderRadius: "10px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              textDecoration: "none",
            }}
          >
            <span style={{ color: card.accent ? "var(--gold)" : "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>
              {card.eyebrow}
            </span>
            <span style={{ color: "var(--text)", fontSize: "15px", fontWeight: 700 }}>
              {card.label}
            </span>
            <span style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
              {card.desc}
            </span>
            <span style={{ color: card.accent ? "var(--gold)" : "var(--blue)", fontSize: "12px", fontWeight: 700, marginTop: "6px" }}>
              {card.cta} →
            </span>
          </Link>
        ))}
      </section>

      {/* ── Sources strip ────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ color: "var(--emerald)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>
            {liveSources.length} fontes ativas
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {liveSources.map((s) => (
              <Link
                key={s.company}
                href="/sources"
                style={{
                  background: "rgba(16,185,129,.1)",
                  color: "var(--emerald)",
                  border: "1px solid rgba(16,185,129,.25)",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "12px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                {s.company}
              </Link>
            ))}
            {trackedSources.filter((s) => !/live/i.test(s.status)).slice(0, 3).map((s) => (
              <span
                key={s.company}
                style={{
                  background: "var(--surf)",
                  color: "var(--dim)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "12px",
                }}
              >
                {s.company}
              </span>
            ))}
            <Link
              href="/sources"
              style={{ color: "var(--dim)", fontSize: "12px", padding: "3px 8px", textDecoration: "none" }}
            >
              +{trackedSources.length - liveSources.length - 3} catalogadas →
            </Link>
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <div style={{ color: "var(--dim)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>
            Stack do perfil
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {candidateProfile.coreStack.slice(0, 6).map((s) => (
              <Link
                key={s}
                href={`/jobs?q=${encodeURIComponent(s)}`}
                style={{
                  background: "var(--surf)",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "2px 7px",
                  fontSize: "11px",
                  textDecoration: "none",
                }}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
