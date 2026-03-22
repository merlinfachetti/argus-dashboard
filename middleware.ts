import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthConfigured, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login"]);
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.has(pathname);
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isPublicPath || isPublicApi) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (pathname === "/login" && (await verifySessionToken(token))) {
      return NextResponse.redirect(new URL("/control-center", request.url));
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isValid = await verifySessionToken(token);

  if (isValid) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
