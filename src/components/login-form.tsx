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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

      window.location.href = payload.redirectTo ?? "/control-center";
    } catch {
      setError("Falha inesperada ao autenticar.");
      setIsSubmitting(false);
    }
  }

  return (
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

      {error ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Autenticando..." : "Entrar no portal"}
      </button>
    </form>
  );
}
