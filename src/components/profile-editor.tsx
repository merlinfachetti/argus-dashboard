"use client";

import { useState, useCallback } from "react";
import type { CandidateProfile } from "@/lib/profile";

interface ProfileEditorProps {
  profile: CandidateProfile;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function TagEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (!trimmed || values.includes(trimmed)) { setInput(""); return; }
    onChange([...values, trimmed]);
    setInput("");
  }

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>{label}</p>
      <div className="flex flex-wrap gap-1.5 rounded-xl p-2.5" style={{ background: "var(--surf)", border: "1px solid var(--border)" }}>
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px]" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="ml-0.5 text-[10px]" style={{ color: "var(--dim)" }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
          onBlur={addTag}
          placeholder={placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-[12px] outline-none"
          style={{ color: "var(--text)" }}
        />
      </div>
      <p className="mt-1 text-[10px]" style={{ color: "var(--dim)" }}>Enter ou vírgula para adicionar · × para remover</p>
    </div>
  );
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const [name, setName] = useState(profile.name);
  const [headline, setHeadline] = useState(profile.headline);
  const [location, setLocation] = useState(profile.location);
  const [availability, setAvailability] = useState(profile.availability ?? "");
  const [summary, setSummary] = useState(profile.summary);
  const [languages, setLanguages] = useState(profile.languages);
  const [coreStack, setCoreStack] = useState(profile.coreStack);
  const [targetRoles, setTargetRoles] = useState(profile.targetRoles);
  const [cvText, setCvText] = useState(profile.cvText);
  const [coverLetterText, setCoverLetterText] = useState(profile.coverLetterText);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMsg, setSaveMsg] = useState("");

  const handleSave = useCallback(async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, headline, location, availability, summary,
          languages, coreStack, targetRoles, cvText, coverLetterText,
        }),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) {
        setSaveState("error");
        setSaveMsg(payload.error ?? "Erro ao salvar");
      } else {
        setSaveState("saved");
        setSaveMsg("Perfil salvo — match será recalculado nas próximas análises.");
        setTimeout(() => setSaveState("idle"), 3000);
      }
    } catch {
      setSaveState("error");
      setSaveMsg("Falha na conexão");
    }
  }, [name, headline, location, availability, summary, languages, coreStack, targetRoles, cvText, coverLetterText]);

  return (
    <div className="space-y-6">
      {/* Identidade */}
      <section className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Identidade</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Nome", value: name, set: setName },
            { label: "Headline", value: headline, set: setHeadline },
            { label: "Localização", value: location, set: setLocation },
            { label: "Disponibilidade", value: availability, set: setAvailability },
          ].map(({ label, value, set }) => (
            <label key={label} className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>{label}</span>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none transition"
                style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </label>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>Resumo profissional</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full rounded-xl px-3 py-2 text-[13px] leading-6 outline-none transition"
            style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </label>
      </section>

      {/* Stack + Roles + Idiomas */}
      <section className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Competências & alvos</p>
        <div className="space-y-4">
          <TagEditor label="Core Stack" values={coreStack} onChange={setCoreStack} placeholder="TypeScript, React..." />
          <TagEditor label="Roles-alvo" values={targetRoles} onChange={setTargetRoles} placeholder="Senior Engineer, Tech Lead..." />
          <TagEditor label="Idiomas" values={languages} onChange={setLanguages} placeholder="English, Portuguese..." />
        </div>
      </section>

      {/* Documentos */}
      <section className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Documentos</p>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>CV (texto completo)</span>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              rows={8}
              className="w-full rounded-xl px-3 py-2.5 text-[12px] leading-5 outline-none transition"
              style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Cole o texto completo do seu CV..."
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>Cover letter (parágrafo base)</span>
            <textarea
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-[12px] leading-5 outline-none transition"
              style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Parágrafo de apresentação base..."
            />
          </label>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3 pb-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === "saving"}
          className="rounded-full px-6 py-2.5 text-[13px] font-bold transition hover:opacity-80 disabled:opacity-50"
          style={{ background: "var(--gold)", color: "#000" }}
        >
          {saveState === "saving" ? "Salvando..." : "Salvar perfil"}
        </button>
        {saveMsg && (
          <p className="text-[12px]" style={{ color: saveState === "error" ? "#ef4444" : "#10b981" }}>
            {saveMsg}
          </p>
        )}
      </div>
    </div>
  );
}
