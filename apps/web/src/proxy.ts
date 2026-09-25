import { NextRequest, NextResponse } from "next/server";
import { COOKIES, ROUTES } from "@/lib/constants/const";
import { isPublicPath } from "@/lib/auth/public-routes";

export default function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(COOKIES.SESSION_TOKEN)?.value;
  const isAuthenticated = Boolean(sessionToken);
  const { pathname } = request.nextUrl;

  // 1. Pass-through for static assets, internal files, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Unauthenticated check for protected routes
  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated visitor on auth pages bounces to dashboard
  if (isAuthenticated && pathname.startsWith("/auth/login")) {
    return NextResponse.redirect(new URL(ROUTES.STUDENT_DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
