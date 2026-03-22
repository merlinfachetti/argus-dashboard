"use client";

import { useState } from "react";

type LoginFormProps = {
  authConfigured: boolean;
  nextPath: string;
};

export function LoginForm({ authConfigured, nextPath }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessAnimating, setIsSuccessAnimating] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSuccessAnimating) {
      return;
    }

    if (!authConfigured) {
      setError(
        "Auth privada ainda nao configurada. Defina as variaveis de ambiente primeiro.",
      );
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
        setError(payload.error ?? "Falha ao autenticar.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccessAnimating(true);

      window.setTimeout(() => {
        window.location.href = payload.redirectTo ?? "/control-center";
      }, 760);
    } catch {
      setError("Falha inesperada ao autenticar.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isSuccessAnimating ? <div className="auth-reveal" aria-hidden="true" /> : null}

      <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Senha de acesso
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            placeholder="Senha privada do Argus"
          />
        </label>

        {passwordStrength ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-semibold text-slate-700">{passwordStrength.label}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-300"
                style={{ width: passwordStrength.width }}
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || isSuccessAnimating}
          className="h-11 w-full rounded-2xl bg-slate-950 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting || isSuccessAnimating ? "Autenticando..." : "Entrar"}
        </button>
      </form>
    </>
  );
}

function getPasswordStrength(password: string) {
  const trimmed = password.trim();

  if (!trimmed) {
    return null;
  }

  let score = 0;

  if (trimmed.length >= 8) score += 1;
  if (trimmed.length >= 12) score += 1;
  if (/[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed)) score += 1;
  if (/\d/.test(trimmed)) score += 1;
  if (/[^A-Za-z0-9]/.test(trimmed)) score += 1;

  if (score <= 2) {
    return {
      label: "Senha fraca",
      width: "34%",
      message: "Ja funciona como hint inicial, mas vale deixar mais robusta para transmitir mais confianca.",
    };
  }

  if (score <= 4) {
    return {
      label: "Senha mediana",
      width: "68%",
      message: "Ja esta melhor estruturada. Com mais variacao e comprimento, a leitura fica forte.",
    };
  }

  return {
    label: "Senha forte",
    width: "100%",
    message: "Boa composicao. O sinal desta senha esta consistente para o portal privado.",
  };
}
