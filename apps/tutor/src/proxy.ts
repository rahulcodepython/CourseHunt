import { NextRequest, NextResponse } from "next/server";
import {
  decodeJwtPayload,
  getSessionCookie,
  isPathMatch,
  hasAnyRole,
  isBanned,
  needsPasswordChange,
  redirectTo,
} from "@package/lib/middleware";

const authRoutes = ["/auth/login", "/auth/change-password"];

export default async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isAuthRoute = isPathMatch(pathname, authRoutes);
  const isChangePassword = pathname.startsWith("/auth/change-password");

  if (!sessionCookie) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    return redirectTo("/auth/login", request);
  }

  const payload = decodeJwtPayload(sessionCookie);
  const hasAccess = hasAnyRole(payload, ["tutor", "admin"]);
  const banned = isBanned(payload);
  const pendingPassword = needsPasswordChange(payload);

  if (banned) {
    return redirectTo("/restricted", request);
  }

  if (!hasAccess) {
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

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
