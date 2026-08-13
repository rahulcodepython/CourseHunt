import { NextRequest, NextResponse } from "next/server";
import { decodeJwtPayload } from "@/lib/jwt-decoder";

function isTokenAlive(token?: string): boolean {
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    if (!payload || payload.banned) return false;
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
        return false;
    }
    return true;
}

function isAdminUser(token?: string): boolean {
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    if (!payload) return false;
    const roles: string[] = (payload as any).roles || ((payload as any).role ? [(payload as any).role] : []);
    return roles.includes("admin") || roles.includes("superadmin");
}

export default function middleware(request: NextRequest) {
    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    const accessAlive = isTokenAlive(accessToken);
    const refreshAlive = isTokenAlive(refreshToken);

    // If either access_token or refresh_token is alive (or present in cookies), treat user as authenticated
    const isAuthenticated = accessAlive || refreshAlive || Boolean(accessToken || refreshToken);

    const authRoute = "/auth/login";
    const { pathname } = request.nextUrl;

    if (!isAuthenticated) {
        return pathname === authRoute
            ? NextResponse.next()
            : NextResponse.redirect(new URL(authRoute, request.url));
    }

    // Check admin authorization for protected routes
    const activeToken = accessToken || refreshToken;
    if (pathname !== authRoute && activeToken && !isAdminUser(activeToken)) {
        return NextResponse.redirect(new URL(authRoute, request.url));
    }

    // Authenticated user attempting to visit /auth/login -> redirect to home page "/"
    if (pathname === authRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};