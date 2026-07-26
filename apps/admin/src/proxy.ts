import { NextRequest, NextResponse } from "next/server";
import {
  decodeJwtPayload,
  getSessionCookie,
  isPathMatch,
  hasRole,
  isBanned,
  needsPasswordChange,
  redirectTo,
  middlewareMatcher,
} from "@package/lib/middleware";

const authRoutes = ["/auth/login", "/auth/change-password"];

export default async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (!sessionCookie) {
    return redirectTo("/auth/login", request);
  }

  const payload = decodeJwtPayload(sessionCookie);
  const isAdmin = hasRole(payload, "admin");
  const banned = isBanned(payload);
  const pendingPassword = needsPasswordChange(payload);
  const isChangePassword = pathname.startsWith("/auth/change-password");
  const isAuthRoute = isPathMatch(pathname, authRoutes);

  if (banned) {
    return redirectTo("/auth/login", request);
  }

  if (!isAdmin) {
    return redirectTo("/auth/login", request);
  }

  if (pendingPassword && !isChangePassword) {
    return redirectTo("/auth/change-password", request);
  }

  if (isAuthRoute && !pendingPassword) {
    return redirectTo("/", request);
  }

  return NextResponse.next();
}

export const config = { matcher: middlewareMatcher };
