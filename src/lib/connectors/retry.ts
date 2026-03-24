// retry.ts — retry com backoff exponencial para conectores
// Logs estruturados de falha por fonte

export type ConnectorResult<T> = {
  data: T | null;
  error: string | null;
  attempts: number;
  durationMs: number;
  source: string;
};

export async function withRetry<T>(
  source: string,
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 800,
): Promise<ConnectorResult<T>> {
  const start = Date.now();
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        data,
        error: null,
        attempts: attempt,
        durationMs: Date.now() - start,
        source,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(
        `[Argus connector] ${source} — attempt ${attempt}/${maxAttempts} failed: ${lastError}`,
      );

      if (attempt < maxAttempts) {
        // Backoff exponencial: 800ms, 1600ms, 3200ms
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1)),
        );
      }
    }
  }

  console.error(
    `[Argus connector] ${source} — all ${maxAttempts} attempts exhausted. Last error: ${lastError}`,
  );

  return {
    data: null,
    error: lastError,
    attempts: maxAttempts,
    durationMs: Date.now() - start,
    source,
  };
}
