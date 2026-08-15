import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG } from "@/lib/const";
import { decodeJwtPayload } from "@/lib/jwt-decoder";
import { accessTokenCookie, clearAccessTokenCookie } from "@/lib/access-token-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? AUTH_CONFIG.DEFAULT_APP_URL;

// Single source of truth for the client session. Called once per page load by
// SessionProvider (and after sign-in / password change):
//
//   1. Validates the better-auth session server-side (reusing /get-session,
//      which also mints a fresh JWT with roles/permissions claims).
//   2. Sets or clears the HttpOnly access_token cookie.
//   3. Returns user + session + roles + permissions in one round trip, so the
//      client never polls or reads the JWT itself.
export async function GET(req: NextRequest) {
    const cookieHeader = req.headers.get("cookie") ?? "";

    const res = await fetch(`${BASE_URL}/api/auth/get-session`, {
        headers: { cookie: cookieHeader },
        cache: "no-store",
    });

    let body: { user?: unknown; session?: unknown } | null = null;
    try {
        body = await res.json();
    } catch {
        body = null;
    }

    const user = body?.user ?? null;
    if (!user) {
        const response = NextResponse.json({
            authenticated: false,
            user: null,
            session: null,
            roles: [],
            permissions: [],
        });
        response.headers.set("Set-Cookie", clearAccessTokenCookie());
        return response;
    }

    const jwt = res.headers.get("set-auth-jwt");
    const payload = jwt ? decodeJwtPayload(jwt) : null;

    const response = NextResponse.json({
        authenticated: true,
        user,
        session: body?.session ?? null,
        roles: payload?.roles ?? [],
        permissions: payload?.permissions ?? [],
    });
    if (jwt) {
        response.headers.set("Set-Cookie", accessTokenCookie(jwt));
    }
    return response;
}