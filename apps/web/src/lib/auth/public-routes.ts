import { ROUTES } from "@/lib/constants/const";

// Routes visible without a session: the marketing/browse site. Shared
// between edge middleware (middleware.ts) and SessionProvider.
const PUBLIC_PREFIXES = ["/courses"];

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
