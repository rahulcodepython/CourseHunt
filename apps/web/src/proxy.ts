import { NextRequest, NextResponse } from "next/server";
import {
  decodeJwtPayload,
  getSessionCookie,
  isPathMatch,
  isBanned,
  redirectTo,
} from "@package/lib/middleware";

const protectedRoutes = ["/dashboard", "/checkout"];
const authRoutes = ["/auth/login"];

export default async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (!sessionCookie) {
    if (isPathMatch(pathname, protectedRoutes)) {
      return redirectTo("/auth/login", request);
    }
    return NextResponse.next();
  }

  const payload = decodeJwtPayload(sessionCookie);

  if (isBanned(payload)) {
    return redirectTo("/restricted", request);
  }

  if (isPathMatch(pathname, authRoutes)) {
    return redirectTo("/", request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
