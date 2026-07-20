import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/adminpanel", "/dashboard", "/checkout"];
const authRoutes = ["/auth/login"];

export default async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);
    const { pathname } = request.nextUrl;

    const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
    const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

    if (isProtectedRoute && !sessionCookie) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (isAuthRoute && sessionCookie) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
