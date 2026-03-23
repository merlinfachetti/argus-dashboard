"use client";

import { useI18n } from "@/lib/i18n/context";

export function LangSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div
      style={{ background: "#0f172a", border: "1px solid #334155" }}
      className="flex h-7 items-center gap-0.5 rounded-full p-0.5"
      role="group"
      aria-label="Language"
    >
      {(["en", "pt"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          style={
            lang === l
              ? { background: "#38bdf8", color: "#0f172a" }
              : { color: "#64748b" }
          }
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition hover:text-slate-300"
          aria-pressed={lang === l}
        >
          {l === "en" ? "EN" : "PT"}
        </button>
      ))}
    </div>
  );
}
