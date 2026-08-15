import { NextRequest, NextResponse } from "next/server";
import { decodeJwtPayload } from "@/lib/jwt-decoder";
import { COOKIES, ROUTES } from "@/lib/const";
import { buildRoutePermissionMap, isRouteAllowed } from "@/lib/permissions";
import navAdminGroups from "@/config/nav-admin.json";
import navTutorGroups from "@/config/nav-tutor.json";
import type { NavGroup } from "@/components/app-sidebar";

interface CustomJwtPayload extends Record<string, unknown> {
    role?: string;
    roles?: string[];
    permissions?: string[];
    password_changed?: boolean;
}

// Built once when the middleware module loads, combining all section nav maps.
const routePermissionMap = {
    ...buildRoutePermissionMap(navAdminGroups as NavGroup[]),
    ...buildRoutePermissionMap(navTutorGroups as NavGroup[]),
};

export default function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get(COOKIES.SESSION_TOKEN)?.value;
    const accessToken = request.cookies.get(COOKIES.ACCESS_TOKEN)?.value;

    const isAuthenticated = Boolean(sessionCookie);
    const { pathname } = request.nextUrl;

    if (!isAuthenticated) {
        return pathname === ROUTES.LOGIN
            ? NextResponse.next()
            : NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }

    // Decode JWT payload once for all authorization and status checks.
    const decoded = accessToken ? (decodeJwtPayload(accessToken) as CustomJwtPayload) : null;
    const exp = typeof decoded?.exp === "number" ? decoded.exp : 0;
    const payload = decoded && exp && exp * 1000 <= Date.now() ? null : decoded;

    // Force password change on first login (passwordChangedAt is NULL).
    if (pathname !== ROUTES.CHANGE_PASSWORD && payload && payload.password_changed === false) {
        return NextResponse.redirect(new URL(ROUTES.CHANGE_PASSWORD, request.url));
    }

    // Route authorization: 1:1 permission gate check driven by navigation catalog
    if (pathname !== ROUTES.LOGIN && payload) {
        if (!isRouteAllowed(pathname, routePermissionMap, payload.permissions || [])) {
            return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
        }
    }

    // Authenticated user (with a valid JWT) attempting to visit /auth/login -> redirect to home.
    if (pathname === ROUTES.LOGIN) {
        return payload ? NextResponse.redirect(new URL(ROUTES.HOME, request.url)) : NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};