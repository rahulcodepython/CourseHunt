import { decodeJwtPayload } from "@/lib/jwt-decoder";
import { COOKIES } from "@/lib/const";

const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
const IS_PROD = process.env.NODE_ENV === "production";

// The access_token JWT is HttpOnly and server-managed only: JS can never read
// or write it. It is scoped to NEXT_PUBLIC_COOKIE_DOMAIN so the browser sends
// it to every *.coursehunt.localhost origin (admin app + Go API) automatically.
function accessTokenCookie(jwt: string): string {
    const payload = decodeJwtPayload(jwt);
    const exp =
        typeof payload?.exp === "number"
            ? payload.exp
            : Math.floor(Date.now() / 1000) + 60 * 60;
    const maxAge = Math.max(0, Math.round(exp - Date.now() / 1000));

    return [
        `${COOKIES.ACCESS_TOKEN}=${jwt}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        ...(COOKIE_DOMAIN ? [`Domain=${COOKIE_DOMAIN}`] : []),
        `Max-Age=${maxAge}`,
        ...(IS_PROD ? ["Secure"] : []),
    ].join("; ");
}

function clearAccessTokenCookie(): string {
    return [
        `${COOKIES.ACCESS_TOKEN}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        ...(COOKIE_DOMAIN ? [`Domain=${COOKIE_DOMAIN}`] : []),
        "Max-Age=0",
    ].join("; ");
}

export { accessTokenCookie, clearAccessTokenCookie };