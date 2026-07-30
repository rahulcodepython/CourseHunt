"use client";

import { useAuthMeQuery } from "@package/query-hooks/auth.api";
import { useSessionStore } from "@package/store/session.store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useAuthMeQuery();
  const setSession = useSessionStore((s) => s.setSession);
  const setPending = useSessionStore((s) => s.setPending);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const user = data?.success && data?.data ? data.data : null;
    setSession(user ? { user, session: null } : null);
  }, [data, setSession]);

  useEffect(() => {
    setPending(isPending);
  }, [isPending, setPending]);

  useEffect(() => {
    if (isPending) return;

    const user = data?.success && data?.data ? (data.data as any) : null;
    if (user && (user.passwordChangedAt === null || user.passwordChangedAt === undefined)) {
      if (!pathname.startsWith("/auth/change-password")) {
        router.push("/auth/change-password");
      }
    }
  }, [data, isPending, pathname, router]);

  return <>{children}</>;
}
