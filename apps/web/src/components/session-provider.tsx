"use client";

import useSession from "@/hooks/use-session";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES, getDashboardURI } from "@/lib/const";
import { buildRoutePermissionMap, isRouteAllowed } from "@/lib/permissions";
import { isPublicPath } from "@/lib/public-routes";
import navAdminGroups from "@/config/nav-admin.json";
import navTutorGroups from "@/config/nav-tutor.json";
import navStudentGroups from "@/config/nav-student.json";
import type { NavGroup } from "@/components/app-sidebar";

const routePermissionMap = {
    ...buildRoutePermissionMap(navAdminGroups as NavGroup[]),
    ...buildRoutePermissionMap(navTutorGroups as NavGroup[]),
    ...buildRoutePermissionMap(navStudentGroups as NavGroup[]),
};

const DASHBOARD_PREFIXES = [ROUTES.ADMIN_DASHBOARD, ROUTES.TUTOR_DASHBOARD, ROUTES.STUDENT_DASHBOARD] as const;

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isPending, permissions, mustChangePassword } = useSession();

    const isAuthRoute = pathname.startsWith("/auth");
    const isChangePassword = pathname.startsWith(ROUTES.CHANGE_PASSWORD);
    const isPublic = isPublicPath(pathname);
    const roleHome = getDashboardURI(user?.role ?? null);

    // A role visiting another role's dashboard prefix (e.g. a student on /admin,
    // or an admin on /student) bounces to its own dashboard home.
    const isCrossSegment = DASHBOARD_PREFIXES.some(
        (prefix) => prefix !== roleHome && pathname.startsWith(prefix),
    );

    let shouldRedirect: string | null = null;

    if (!isPending) {
        if (!user) {
            // Unauthenticated: public pages (landing/courses/checkout) and
            // /auth/* are visible; redirect everything else to login.
            if (!isPublic && !pathname.startsWith(ROUTES.LOGIN)) shouldRedirect = ROUTES.LOGIN;
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

    // Public pages render immediately rather than blocking on the session
    // check — an anonymous visitor on the landing page has no session to
    // wait for, and shouldn't see a full-screen spinner before it loads.
    if (isPending && !isPublic) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return children;
}

export default SessionProvider;