import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/adminpanel", "/dashboard", "/checkout"];
const authRoutes = ["/auth/login"];

function decodeJwtPayload(token: string): Record<string, any> | null {
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

export default async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);
    const { pathname } = request.nextUrl;

    const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
    const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

    if (!sessionCookie) {
        if (isProtectedRoute) {
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
        return NextResponse.next();
    }

    const payload = decodeJwtPayload(sessionCookie);
    const isBanned = payload?.banned === true;

    if (isBanned) {
        return NextResponse.redirect(new URL("/restricted", request.url));
    }

    if (isAuthRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
