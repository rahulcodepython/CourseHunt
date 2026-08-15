import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { accessTokenCookie, clearAccessTokenCookie } from "@/lib/access-token-cookie";

const { GET: baseGET, POST: basePOST } = toNextJsHandler(auth);

// The access_token cookie is managed here server-side: set whenever better-auth
// mints a fresh JWT (set-auth-jwt header on /get-session) and cleared on
// sign-out. HttpOnly means only the server can ever touch it.
function applyJwtCookie(res: Response, jwt: string | null): void {
    if (jwt) {
        res.headers.append("Set-Cookie", accessTokenCookie(jwt));
    }
}

export async function GET(req: NextRequest) {
    const res = await baseGET(req);
    applyJwtCookie(res, res.headers.get("set-auth-jwt"));
    return res;
}

export async function POST(req: NextRequest) {
    const res = await basePOST(req);
    const pathname = new URL(req.url).pathname;
    if (pathname.endsWith("/sign-out")) {
        res.headers.append("Set-Cookie", clearAccessTokenCookie());
    }
    applyJwtCookie(res, res.headers.get("set-auth-jwt"));
    return res;
}