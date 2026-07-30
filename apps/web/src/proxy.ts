import { NextRequest, NextResponse } from "next/server";
import { decodeJwtPayload } from "@package/lib/jwt-decoder";

const protectedPrefixes = ["/dashboard", "/checkout", "/wishlist"];
const authRoute = "/auth/login";
const bannedRoute = "/auth/restricted";

export default function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get("access_token")?.value;
    const { pathname } = request.nextUrl;
    const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));

    if (!sessionCookie) {
        if (isProtected) {
            return NextResponse.redirect(new URL(authRoute, request.url));
        }
        if (pathname === authRoute) {
            return NextResponse.next();
        }
        return NextResponse.next();
    }

    const payload = decodeJwtPayload(sessionCookie);

    if (!payload) {
        if (isProtected) {
            return NextResponse.redirect(new URL(authRoute, request.url));
        }
        return NextResponse.next();
    }

    if (payload.banned && pathname !== bannedRoute) {
        return NextResponse.redirect(new URL(bannedRoute, request.url));
    } else if (pathname === bannedRoute && !payload.banned) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname === authRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
