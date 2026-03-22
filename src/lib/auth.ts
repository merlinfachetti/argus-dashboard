const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export const AUTH_COOKIE_NAME = "argus_session";

export function isAuthConfigured() {
  return Boolean(
    process.env.ARGUS_ACCESS_PASSWORD && process.env.ARGUS_SESSION_SECRET,
  );
}

function getSessionSecret() {
  return process.env.ARGUS_SESSION_SECRET ?? "";
}

function getAccessPassword() {
  return process.env.ARGUS_ACCESS_PASSWORD ?? "";
}

function getSessionTtlSeconds() {
  const ttl = Number(process.env.ARGUS_SESSION_TTL_SECONDS ?? "");
  return Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_SESSION_TTL_SECONDS;
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken() {
  const expiresAt = Date.now() + getSessionTtlSeconds() * 1000;
  const payload = `${expiresAt}`;
  const signature = await sha256Hex(`${payload}.${getSessionSecret()}`);

  return `${payload}.${signature}`;
}

export async function verifySessionToken(token?: string | null) {
  if (!token || !isAuthConfigured()) {
    return false;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const expectedSignature = await sha256Hex(`${payload}.${getSessionSecret()}`);
  return expectedSignature === signature;
}

export function isPasswordValid(password: string) {
  return isAuthConfigured() && password === getAccessPassword();
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionTtlSeconds(),
  };
}
