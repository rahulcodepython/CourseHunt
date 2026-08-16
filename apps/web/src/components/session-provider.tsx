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

const routePermissionMap = {
    ...buildRoutePermissionMap(navAdminGroups as NavGroup[]),
    ...buildRoutePermissionMap(navTutorGroups as NavGroup[]),
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isPending, permissions, mustChangePassword } = useSession();

    const isAuthRoute = pathname.startsWith("/auth");
    const isChangePassword = pathname.startsWith(ROUTES.CHANGE_PASSWORD);
    const roleHome = getDashboardURI(user?.role ?? null);

    const isCrossSegment =
        (user?.role === ROLES.ADMIN && pathname.startsWith(ROUTES.TUTOR_DASHBOARD)) ||
        (user?.role === ROLES.TUTOR && pathname.startsWith(ROUTES.ADMIN_DASHBOARD));

    let shouldRedirect: string | null = null;

    if (!isPending) {
        if (!user) {
            // Unauthenticated: allow only /auth/login; redirect everything else to login.
            if (!pathname.startsWith(ROUTES.LOGIN)) shouldRedirect = ROUTES.LOGIN;
        } else if (mustChangePassword && !isChangePassword) {
            // First-login password change enforced on all routes except the change-password page.
            shouldRedirect = ROUTES.CHANGE_PASSWORD;
        } else if (isCrossSegment) {
            // Role-segment mismatch (e.g. admin visiting /tutor/*).
            shouldRedirect = roleHome;
        } else if (!isAuthRoute && !isRouteAllowed(pathname, routePermissionMap, permissions)) {
            // Permission gate — only applies to protected routes, not /auth/*.
            shouldRedirect = roleHome;
        }
        // Authenticated user on /auth/login: no-op — login page handles its own
        // post-login navigation via router.push to avoid racing this effect.
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