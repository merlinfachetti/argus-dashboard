// rate-limit.ts — rate limiting simples para rotas de discovery
// Usa um Map em memória por fonte — reseta a cada deploy (Vercel serverless)
// Para produção real usaria Redis/Edge Config, mas isso cobre o uso pessoal

const requestCounts = new Map<string, { count: number; windowStart: number }>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  default:      { max: 10, windowMs: 60 * 60 * 1000 }, // 10/hora
  siemens:      { max: 6,  windowMs: 30 * 60 * 1000 }, // 6/30min
  rheinmetall:  { max: 6,  windowMs: 30 * 60 * 1000 },
  bwi:          { max: 6,  windowMs: 30 * 60 * 1000 },
  hensoldt:     { max: 6,  windowMs: 30 * 60 * 1000 },
  secunet:      { max: 6,  windowMs: 30 * 60 * 1000 },
  "rohde-schwarz": { max: 6, windowMs: 30 * 60 * 1000 },
  airbus:       { max: 6,  windowMs: 30 * 60 * 1000 },
  bayer:        { max: 6,  windowMs: 30 * 60 * 1000 },
  sap:          { max: 12, windowMs: 60 * 60 * 1000 }, // SAP API é mais permissiva
};

export function checkRateLimit(source: string): { allowed: boolean; retryAfterMs?: number } {
  const limit = LIMITS[source.toLowerCase()] ?? LIMITS.default;
  const now = Date.now();
  const key = source.toLowerCase();
  const entry = requestCounts.get(key);

  if (!entry || now - entry.windowStart > limit.windowMs) {
    // Nova janela
    requestCounts.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= limit.max) {
    const retryAfterMs = limit.windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count++;
  return { allowed: true };
}
