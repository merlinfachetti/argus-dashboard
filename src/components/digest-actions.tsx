"use client";

import { useState, useTransition } from "react";
import { useT } from "@/lib/i18n/context";

type ActionState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const idleState: ActionState = {
  tone: "idle",
  message: "Persistir o preview no banco ou disparar um email de teste.",
};

export function DigestActions() {
  const t = useT();
  const [status, setStatus] = useState<ActionState>(idleState);
  const [isPending, startTransition] = useTransition();

  function runAction(pathname: string) {
    startTransition(async () => {
      try {
        const response = await fetch(pathname, { method: "POST" });
        const payload = (await response.json()) as {
          error?: string;
          preview?: { subject?: string };
        };

        if (!response.ok) throw new Error(payload.error ?? "Falha na operação");

        setStatus({
          tone: "success",
          message:
            pathname === "/api/digests/send"
              ? `Email disparado${payload.preview?.subject ? `: ${payload.preview.subject}` : ""}.`
              : "Preview persistido no banco.",
        });
      } catch (err) {
        setStatus({
          tone: "error",
          message: err instanceof Error ? err.message : "Falha ao executar",
        });
      }
    });
  }

  return (
    <div className="rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Testes operacionais
      </p>
      <p
        className={[
          "mt-2 text-[12px] leading-5",
          status.tone === "error" ? "text-rose-600" :
          status.tone === "success" ? "text-emerald-700" :
          "text-slate-500",
        ].join(" ")}
      >
        {status.message}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction("/api/digests/today")}
          className="flex-1 rounded-full border border-slate-200 bg-white py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {t("digests.persist")}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction("/api/digests/send")}
          className="flex-1 rounded-full bg-slate-950 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {t("digests.sendTest")}
        </button>
      </div>
    </div>
  );
}
