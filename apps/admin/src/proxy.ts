import { NextRequest, NextResponse } from "next/server";
import { decodeJwtPayload } from "@package/lib/jwt-decoder";

export default function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get("access_token")?.value;
    const authRoute = "/auth/login";
    const { pathname } = request.nextUrl;

    if (!sessionCookie) {
        return pathname === authRoute ? NextResponse.next() : NextResponse.redirect(new URL(authRoute, request.url));
    }

    const payload = decodeJwtPayload(sessionCookie);

    if (!payload || payload.banned || !payload.roles.includes("admin")) {
        return NextResponse.redirect(new URL(authRoute, request.url));
    }

    if (pathname === authRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};