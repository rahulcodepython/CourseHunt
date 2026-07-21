"use client";

import { useSession } from "@package/auth/auth-client";
import { useSessionStore } from "@/stores/session-store";
import { useEffect } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const setSession = useSessionStore((s) => s.setSession);
  const setPending = useSessionStore((s) => s.setPending);

  useEffect(() => {
    setSession(session ?? null);
  }, [session, setSession]);

  useEffect(() => {
    setPending(isPending);
  }, [isPending, setPending]);

  return <>{children}</>;
}
