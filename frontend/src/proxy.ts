import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/admin", "/user", "/checkout", "/study"];
const authRoutes = ["/login"];

export default async function proxy(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);
    const { pathname } = request.nextUrl;

    // Check if it's a protected route
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute && !sessionCookie) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAuthRoute && sessionCookie) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
