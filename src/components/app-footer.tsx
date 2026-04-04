import Image from "next/image";
import Link from "next/link";

export function AppFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surf)" }}>
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Logo + tagline */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image
            src="/logo-argus.png"
            alt="Argus"
            width={26}
            height={26}
            style={{ width: "26px", height: "26px", objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(245,158,11,0.4))" }}
          />
          <div>
            <div style={{ color: "var(--gold)", fontWeight: 700, fontSize: "12px", letterSpacing: "0.06em" }}>ARGUS</div>
            <div style={{ color: "var(--dim)", fontSize: "10px" }}>vigilância total, decisão precisa</div>
          </div>
        </div>

        {/* Credit */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "18px",
              height: "18px",
              background: "linear-gradient(135deg, #b45309, #f59e0b)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "8px",
              fontWeight: 700,
              color: "#020810",
              flexShrink: 0,
            }}
          >
            AM
          </span>
          <Link
            href="https://aldenmerlin.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--dim)", fontSize: "11px", textDecoration: "none" }}
          >
            Criado por <span style={{ color: "var(--muted)", fontWeight: 600 }}>Alden Merlin</span> · 2026
          </Link>
          <span style={{ color: "var(--border-l)", fontSize: "11px" }}>·</span>
          <span style={{ color: "var(--dim)", fontSize: "10px" }}>Next.js · Prisma · Vercel · Neon</span>
        </div>
      </div>
    </footer>
  );
}
