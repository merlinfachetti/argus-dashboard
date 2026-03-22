"use client";

import { useState, useTransition } from "react";

type DigestActionState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const idleState: DigestActionState = {
  tone: "idle",
  message: "Use os controles abaixo para persistir o preview ou disparar um email de teste.",
};

export function DigestActions() {
  const [status, setStatus] = useState<DigestActionState>(idleState);
  const [isPending, startTransition] = useTransition();

  function runAction(pathname: string) {
    startTransition(async () => {
      try {
        const response = await fetch(pathname, {
          method: "POST",
        });
        const payload = (await response.json()) as {
          error?: string;
          preview?: { subject?: string };
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Falha na operacao do digest");
        }

        setStatus({
          tone: "success",
          message:
            pathname === "/api/digests/send"
              ? `Email disparado com sucesso${payload.preview?.subject ? `: ${payload.preview.subject}` : ""}.`
              : "Preview persistido no banco com sucesso.",
        });
      } catch (error) {
        setStatus({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Falha ao executar acao de digest",
        });
      }
    });
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/88 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Testes operacionais
          </p>
          <p
            className={`mt-2 text-sm leading-7 ${
              status.tone === "error"
                ? "text-rose-600"
                : status.tone === "success"
                  ? "text-emerald-700"
                  : "text-slate-500"
            }`}
          >
            {status.message}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction("/api/digests/today")}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Persistir preview
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction("/api/digests/send")}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enviar email de teste
          </button>
        </div>
      </div>
    </div>
  );
}
