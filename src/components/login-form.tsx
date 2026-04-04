"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/context";

type LoginFormProps = {
  authConfigured: boolean;
  nextPath: string;
};

export function LoginForm({ authConfigured, nextPath }: LoginFormProps) {
  const t = useT();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessAnimating, setIsSuccessAnimating] = useState(false);

  const passwordStrength = getPasswordStrength(password, t);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSuccessAnimating) {
      return;
    }

    if (!authConfigured) {
      setError(t("login.authNotConfigured"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          next: nextPath,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? t("login.authFailure"));
        setIsSubmitting(false);
        return;
      }

      setIsSuccessAnimating(true);

      window.setTimeout(() => {
        window.location.href = payload.redirectTo ?? "/control-center";
      }, 760);
    } catch {
      setError(t("login.authFailure"));
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isSuccessAnimating ? <div className="auth-reveal" aria-hidden="true" /> : null}

      <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
            {t("login.passwordLabel")}
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-2xl px-4 text-[13px] outline-none transition"
            style={{ background: "var(--surf)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder={t("login.placeholder")}
          />
        </label>

        {passwordStrength ? (
          <div className="rounded-2xl px-4 py-3" style={{ background: "var(--surf)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>{passwordStrength.label}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(148,163,184,.15)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: passwordStrength.width, background: "var(--gold)" }}
              />
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "var(--dim)" }}>{passwordStrength.message}</p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[20px] px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)" }}>
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || isSuccessAnimating}
          className="h-11 w-full rounded-2xl text-[13px] font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "var(--gold)", color: "#000" }}
        >
          {isSubmitting || isSuccessAnimating ? t("login.authenticating") : t("login.submit")}
        </button>
      </form>
    </>
  );
}

function getPasswordStrength(password: string, t: (key: string) => string) {
  const trimmed = password.trim();

  if (!trimmed) return null;

  let score = 0;
  if (trimmed.length >= 8) score += 1;
  if (trimmed.length >= 12) score += 1;
  if (/[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed)) score += 1;
  if (/\d/.test(trimmed)) score += 1;
  if (/[^A-Za-z0-9]/.test(trimmed)) score += 1;

  if (score <= 2) {
    return { label: t("login.weakPassword"), width: "34%", message: t("login.weakHint") };
  }
  if (score <= 4) {
    return { label: t("login.mediumPassword"), width: "68%", message: t("login.mediumHint") };
  }
  return { label: t("login.strongPassword"), width: "100%", message: t("login.strongHint") };
}
