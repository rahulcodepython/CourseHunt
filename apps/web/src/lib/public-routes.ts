import { ROUTES } from "@/lib/const";

// Routes visible without a session: the marketing/browse site and checkout
// (which gates only the purchase action itself, not the page). Shared
// between the edge middleware (proxy.ts) and SessionProvider so the two
// gates never drift apart.
const PUBLIC_PREFIXES = ["/courses", "/checkout"];

export function isPublicPath(pathname: string): boolean {
    if (
        pathname === ROUTES.HOME ||
        pathname === ROUTES.LOGIN ||
        pathname === ROUTES.CHANGE_PASSWORD ||
        pathname === ROUTES.TWO_FACTOR
    ) {
        return true;
    }
    return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
