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

      <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Senha de acesso
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-13 rounded-[20px] border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            placeholder="Digite a senha privada do Argus"
          />
        </label>

        {passwordStrength ? (
          <div className="rounded-[20px] border border-violet-200 bg-violet-50/90 px-4 py-3 text-sm text-violet-700 shadow-[0_12px_30px_rgba(139,92,246,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{passwordStrength.label}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">
                Password signal
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#a855f7,#7c3aed)] transition-all duration-300"
                style={{ width: passwordStrength.width }}
              />
            </div>
            <p className="mt-3 text-sm leading-7 text-violet-700">
              {passwordStrength.message}
            </p>
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
          className="inline-flex h-12 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(15,23,42,0.22)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting || isSuccessAnimating ? "Authenticating..." : "Authenticate"}
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
