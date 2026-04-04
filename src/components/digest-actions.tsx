"use client";

import { useState, useTransition } from "react";
import { useT } from "@/lib/i18n/context";

type ActionState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const idleState: ActionState = {
  tone: "idle",
  message: "",
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

        if (!response.ok) throw new Error(payload.error ?? t("digests.operationFailed"));

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
    <div className="rounded-[24px] p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
        {t("digests.opsTests")}
      </p>
      <p
        className="mt-2 text-[12px] leading-5"
        style={{
          color: status.tone === "error" ? "#ef4444" :
                 status.tone === "success" ? "#10b981" :
                 "var(--dim)",
        }}
      >
        {status.message || t("digests.opsTestsHint")}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction("/api/digests/today")}
          className="flex-1 rounded-full py-2 text-[12px] font-semibold transition disabled:opacity-50"
          style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
        >
          {t("digests.persist")}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction("/api/digests/send")}
          className="flex-1 rounded-full py-2 text-[12px] font-semibold transition disabled:opacity-50"
          style={{ background: "transparent", color: "var(--gold)", border: "1px solid rgba(245,158,11,.3)" }}
        >
          {t("digests.sendTest")}
        </button>
      </div>
    </div>
  );
}
