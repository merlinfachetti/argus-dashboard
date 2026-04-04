import Link from "next/link";

export function AppFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--surf)" }}>
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
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
        <span style={{ color: "var(--dim)", fontSize: "11px" }}>
          Desenvolvido por{" "}
          <Link
            href="https://aldenmerlin.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--muted)", fontWeight: 600, textDecoration: "none" }}
          >
            Alden Merlin
          </Link>
          {" "}· Todos os direitos reservados · {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}
