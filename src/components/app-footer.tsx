import Image from "next/image";
import Link from "next/link";

export function AppFooter() {
  return (
    <footer style={{ borderTop: "1px solid #1e293b", backgroundColor: "#0a0f1e" }}>
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">

        {/* Logo + nome */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo-argus.png"
            alt="Argus"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <div>
            <p style={{ color: "#f8fafc" }} className="text-[13px] font-semibold">
              Argus
            </p>
            <p style={{ color: "#475569" }} className="text-[11px]">
              Private job radar — vigilância total, decisão precisa
            </p>
          </div>
        </div>

        {/* Crédito + stack */}
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <div className="flex items-center gap-2">
            {/* Avatar Alden Merlin — initials */}
            <span
              style={{
                background: "linear-gradient(135deg,#b45309,#d97706,#f59e0b)",
                color: "#fff",
              }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
            >
              AM
            </span>
            <Link
              href="https://aldenmerlin.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#64748b" }}
              className="text-[11px] transition hover:text-slate-300"
            >
              Criado por <span style={{ color: "#94a3b8" }} className="font-semibold">Alden Merlin</span> · 2026
            </Link>
          </div>
          <p style={{ color: "#334155" }} className="text-[10px]">
            Next.js · Prisma · Vercel · Neon
          </p>
        </div>

      </div>
    </footer>
  );
}
