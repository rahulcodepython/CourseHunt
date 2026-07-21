import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/"];
const authRoutes = ["/auth/login"];

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(base64);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function hasAdminAccess(payload: Record<string, unknown> | null): boolean {
    if (!payload) return false;
    const roles = payload.roles as string[] | undefined;
    return Array.isArray(roles) && roles.includes("admin");
}

export default async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);
    const { pathname } = request.nextUrl;

    const isRoot = pathname === "/";
    const isProtectedRoute = isRoot || protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
    const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
    const isPendingRoute = pathname.startsWith("/auth/waiting");

    if (!sessionCookie) {
        if (isProtectedRoute) {
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
        return NextResponse.next();
    }

    const payload = decodeJwtPayload(sessionCookie);
    const hasAccess = hasAdminAccess(payload);
    const isBanned = payload?.banned === true;

    if (isBanned) {
        return NextResponse.redirect(new URL("/auth/waiting", request.url));
    }

    if (isAuthRoute) {
        return NextResponse.redirect(new URL(hasAccess ? "/" : "/auth/waiting", request.url));
    }

    if (isProtectedRoute && !hasAccess) {
        return NextResponse.redirect(new URL("/auth/waiting", request.url));
    }

    if (isPendingRoute && hasAccess) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
