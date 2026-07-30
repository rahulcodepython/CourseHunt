"use client";

import { useAuthMeQuery } from "@package/query-hooks/auth.api";
import { useSessionStore } from "@package/store/session.store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    
    // Restrict useAuthMeQuery when user is on /auth/login
    const isAuthLogin = pathname.startsWith("/auth/login");
    const { data, isPending } = useAuthMeQuery({ enabled: !isAuthLogin });

    const setSession = useSessionStore((s) => s.setSession);
    const setPending = useSessionStore((s) => s.setPending);

    useEffect(() => {
        setPending(isPending);

        const user = data?.success && data?.data ? data.data : null;
        setSession(user ? { user, session: null } : null);

        if (!isPending && user && (user.passwordChangedAt === null || user.passwordChangedAt === undefined)) {
            if (!pathname.startsWith("/auth/change-password")) {
                router.push("/auth/change-password");
            }
        }
    }, [data, isPending, pathname, router, setPending, setSession]);

    return children;
}
