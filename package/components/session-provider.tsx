"use client";

import { useAuthSessionQuery } from "@package/query-hooks/auth.api";
import { useSessionStore } from "@package/store/session.store";
import { useEffect } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useAuthSessionQuery();
  const setSession = useSessionStore((s) => s.setSession);
  const setPending = useSessionStore((s) => s.setPending);

  useEffect(() => {
    const user = data?.success && data?.data ? data.data.user : null;
    setSession(user ? { user, session: null } : null);
  }, [data, setSession]);

  useEffect(() => {
    setPending(isPending);
  }, [isPending, setPending]);

  return <>{children}</>;
}
