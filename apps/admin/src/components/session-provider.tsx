"use client";

import { useAuthMeQuery } from "@/query-hooks/auth.api";
import { useSessionStore } from "@/store/session.store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const sessionUser = useSessionStore((s) => s.user);
    const setSession = useSessionStore((s) => s.setSession);
    const setPending = useSessionStore((s) => s.setPending);

    const isAuthLogin = pathname.startsWith("/auth/login");
    const isChangePassword = pathname.startsWith("/auth/change-password");
    const hasUser = Boolean(sessionUser);

    // Session-provider will fetch the user data if the session store is blank
    const { data, isPending } = useAuthMeQuery({
        enabled: !isAuthLogin && !hasUser,
    });

    useEffect(() => {
        setPending(isPending);

        // After fetching, set user data to the store if store is blank
        if (!hasUser && data?.success && data?.data) {
            setSession({ user: data.data, session: null });
        }

        const currentUser = sessionUser || (data?.success && data?.data ? data.data : null);

        // If user has currentUser.passwordChangedAt === null || currentUser.passwordChangedAt === undefined
        // then redirect to /auth/change-password, if not allow user to go to required page
        if (currentUser) {
            const needsPasswordChange =
                currentUser.passwordChangedAt === null || currentUser.passwordChangedAt === undefined;

            if (needsPasswordChange && !isChangePassword) {
                router.push("/auth/change-password");
            } else if (!needsPasswordChange && isChangePassword) {
                router.push("/");
            }
        }
    }, [data, isPending, pathname, router, setPending, setSession, sessionUser, hasUser, isChangePassword]);

    return children;
}
