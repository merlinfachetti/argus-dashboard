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
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[12px] text-slate-700">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="ml-0.5 text-[10px] text-slate-400 hover:text-rose-500"
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
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>
      <p className="mt-1 text-[10px] text-slate-400">Enter ou vírgula para adicionar · × para remover</p>
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
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Identidade</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Nome", value: name, set: setName },
            { label: "Headline", value: headline, set: setHeadline },
            { label: "Localização", value: location, set: setLocation },
            { label: "Disponibilidade", value: availability, set: setAvailability },
          ].map(({ label, value, set }) => (
            <label key={label} className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white"
              />
            </label>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Resumo profissional</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] leading-6 text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white"
          />
        </label>
      </section>

      {/* Stack + Roles + Idiomas */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Competências & alvos</p>
        <div className="space-y-4">
          <TagEditor label="Core Stack" values={coreStack} onChange={setCoreStack} placeholder="TypeScript, React..." />
          <TagEditor label="Roles-alvo" values={targetRoles} onChange={setTargetRoles} placeholder="Senior Engineer, Tech Lead..." />
          <TagEditor label="Idiomas" values={languages} onChange={setLanguages} placeholder="English, Portuguese..." />
        </div>
      </section>

      {/* Documentos */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Documentos</p>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">CV (texto completo)</span>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] leading-5 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
              placeholder="Cole o texto completo do seu CV..."
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Cover letter (parágrafo base)</span>
            <textarea
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] leading-5 text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
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
          style={{ background: "#0f172a", color: "#fff" }}
          className="rounded-full px-6 py-2.5 text-[13px] font-bold transition hover:opacity-80 disabled:opacity-50"
        >
          {saveState === "saving" ? "Salvando..." : "Salvar perfil"}
        </button>
        {saveMsg && (
          <p className={["text-[12px]", saveState === "error" ? "text-rose-500" : "text-emerald-600"].join(" ")}>
            {saveMsg}
          </p>
        )}
      </div>
    </div>
  );
}
