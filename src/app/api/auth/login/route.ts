import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getSessionCookieOptions,
  isAuthConfigured,
  isPasswordValid,
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Auth privada ainda nao configurada. Defina ARGUS_ACCESS_PASSWORD e ARGUS_SESSION_SECRET.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    password?: string;
    next?: string;
  };

  if (!body.password || !isPasswordValid(body.password)) {
    return NextResponse.json(
      { error: "Senha invalida para acesso ao portal." },
      { status: 401 },
    );
  }

  const token = await createSessionToken();
  const redirectTo =
    body.next && body.next.startsWith("/") ? body.next : "/control-center";
  const response = NextResponse.json({ ok: true, redirectTo });

  response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
