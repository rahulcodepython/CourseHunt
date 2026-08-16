"use client";

import useSession from "@/hooks/use-session";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES, ROLES, getDashboardURI } from "@/lib/const";
import { buildRoutePermissionMap, isRouteAllowed } from "@/lib/permissions";
import navAdminGroups from "@/config/nav-admin.json";
import navTutorGroups from "@/config/nav-tutor.json";
import type { NavGroup } from "@/components/app-sidebar";

// Route -> permission lookup, built once. The accessToken JWT is no longer
// stored in cookies, so server middleware can't authorize routes — this gates
// every client-side navigation instead.
const routePermissionMap = {
    ...buildRoutePermissionMap(navAdminGroups as NavGroup[]),
    ...buildRoutePermissionMap(navTutorGroups as NavGroup[]),
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isPending, permissions, mustChangePassword } = useSession();

    // The redirect decision is computed during render so the target page never
    // flashes before the checks finish — the loader is shown for as long as any
    // redirect is pending, and children only render once the route is allowed.
    const isLogin = pathname.startsWith(ROUTES.LOGIN);
    const isChangePassword = pathname.startsWith(ROUTES.CHANGE_PASSWORD);
    const isProtected = !isLogin && !isChangePassword;
    const roleHome = getDashboardURI(user?.role ?? null);

    // An account's segment is fixed at creation (admin/tutor/user) — an admin
    // has no business inside /tutor/* and vice versa, regardless of what
    // custom permissions they hold.
    const isCrossSegment =
        (user?.role === ROLES.ADMIN && pathname.startsWith(ROUTES.TUTOR_DASHBOARD)) ||
        (user?.role === ROLES.TUTOR && pathname.startsWith(ROUTES.ADMIN_DASHBOARD));

    let shouldRedirect: string | null = null;
    if (isPending) {
        // Session still loading — hold the screen.
    } else if (!user) {
        // No session on a protected page -> login. Login/change-password are public.
        if (isProtected) shouldRedirect = ROUTES.LOGIN;
    } else if (isLogin) {
        // Authenticated user on the login page -> dashboard (or change-password first).
        shouldRedirect = mustChangePassword ? ROUTES.CHANGE_PASSWORD : roleHome;
    } else if (mustChangePassword && !isChangePassword) {
        // Force password change on first login.
        shouldRedirect = ROUTES.CHANGE_PASSWORD;
    } else if (isCrossSegment) {
        // Wrong account segment for this section entirely (e.g. an admin
        // wandering into /tutor) -> bounce to their own dashboard.
        shouldRedirect = roleHome;
    } else if (!isRouteAllowed(pathname, routePermissionMap, permissions)) {
        // Route authorization: 1:1 permission gate driven by the navigation catalog.
        shouldRedirect = roleHome;
    }

    useEffect(() => {
        if (!shouldRedirect || shouldRedirect === pathname) return;
        router.replace(shouldRedirect);
    }, [shouldRedirect, pathname, router]);

    if (isPending) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return children;
}

export default SessionProvider;