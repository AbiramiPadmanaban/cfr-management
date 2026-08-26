import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE_NAME } from "@/server/auth/session-crypto";

const AUTH_ROUTES = ["/login", "/forgot-password", "/set-password", "/reset-password"];

function isPublicPath(pathname: string): boolean {
  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }
  if (pathname.startsWith("/feedback/")) {
    return true;
  }
  return false;
}

function isProtectedPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/cfr" || pathname.startsWith("/cfr/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isAuthenticated = Boolean(session?.userId);

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.nextUrl);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (
    isAuthenticated &&
    (pathname === "/login" || pathname === "/forgot-password")
  ) {
    return NextResponse.redirect(new URL("/cfr", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
