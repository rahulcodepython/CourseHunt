"use client";

import { refreshSession } from "@/lib/auth-client";
import { useSessionStore } from "@/store/session.store";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/const";
import { useEffect, useRef } from "react";

// Runs on full page load if token is not in Zustand: hits /api/auth/get-session
// and stores user + session + roles + permissions + token in zustand. SPA navigation
// never refetches — no polling, no duplicate session API calls.
export function SessionProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const hydratedRef = useRef(false);

    const user = useSessionStore((s) => s.user);
    const isPending = useSessionStore((s) => s.isPending);

    const isAuthLogin = pathname.startsWith(ROUTES.LOGIN);

    useEffect(() => {
        if (hydratedRef.current) return;
        hydratedRef.current = true;
        const token = useSessionStore.getState().token;
        if (!token) {
            refreshSession();
        }
    }, []);

    // No session on a protected page -> login. An authenticated session on the
    // login page -> change-password (first login) or home. Redirects never
    // loop because refreshSession re-validates against the server every load.
    useEffect(() => {
        if (isPending) return;

        if (user) {
            if (isAuthLogin) {
                router.replace(user.passwordChangedAt ? ROUTES.HOME : ROUTES.CHANGE_PASSWORD);
            }
            return;
        }

        if (!isAuthLogin) {
            router.replace(ROUTES.LOGIN);
        }
    }, [user, isPending, isAuthLogin, pathname, router]);

    return children;
}