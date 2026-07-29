import { NextRequest, NextResponse } from "next/server";
import {
  decodeJwtPayload,
  getSessionCookie,
  isPathMatch,
  hasRole,
  isBanned,
  needsPasswordChange,
  redirectTo,
} from "@package/lib/middleware";

const authRoutes = ["/auth/login", "/auth/change-password"];

export default function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isAuthRoute = isPathMatch(pathname, authRoutes);

  if (!sessionCookie) {
    return isAuthRoute ? NextResponse.next() : redirectTo("/auth/login", request);
  }

  const payload = decodeJwtPayload(sessionCookie);

  if (isBanned(payload) || !hasRole(payload, "admin")) {
    return redirectTo("/auth/login", request);
  }

  const pendingPassword = needsPasswordChange(payload);
  const isChangePassword = pathname.startsWith("/auth/change-password");

  if (pendingPassword && !isChangePassword) {
    return redirectTo("/auth/change-password", request);
  }

  if (isAuthRoute && !pendingPassword) {
    return redirectTo("/", request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};