"use client";

import { useEffect, useRef, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import authClient from "@/lib/auth-client";
import { useSessionStore, type SessionPayload } from "@/store/session.store";

interface CustomJwtPayload {
  sub?: string;
  user_id?: string;
  role?: string;
  roles?: string[];
  banned?: boolean;
  must_change_password?: boolean;
  exp?: number;
  iat?: number;
}

const EMPTY_SESSION: SessionPayload = {
  user: null,
  session: null,
  roles: [],
  permissions: [],
  token: null,
  mustChangePassword: false,
};

/**
 * Generic builder that decodes a JWT token (role/roles/mustChangePassword —
 * kept small on purpose, see auth.ts) and reads `permissions` off the
 * session response's user object instead, where the server's customSession
 * plugin attaches it (no JWT size constraint there).
 */
export function buildSessionPayload(params: {
  user: unknown;
  session?: unknown;
  jwtToken?: string | null;
}): SessionPayload {
  const { user, session, jwtToken } = params;
  if (!user) return EMPTY_SESSION;

  const payload = jwtToken ? jwtDecode<CustomJwtPayload>(jwtToken) : null;
  const permissions = (user as { permissions?: string[] }).permissions;

  return {
    user: user as SessionPayload["user"],
    session: (session as SessionPayload["session"]) ?? null,
    roles: payload?.roles ?? [],
    permissions: permissions ?? [],
    token: jwtToken ?? null,
    mustChangePassword: Boolean(payload?.must_change_password),
  };
}

// Validates the better-auth session via native authClient.getSession(),
// capturing the minted JWT from set-auth-jwt response header and decoding
// role/roles/mustChangePassword for the client Zustand store using jwtDecode
// (permissions come from the session response itself, see buildSessionPayload).
async function fetchSession(): Promise<SessionPayload> {
  try {
    let jwt: string | null = null;
    const { data, error } = await authClient.getSession({
      fetchOptions: {
        onResponse: (ctx) => {
          jwt = ctx.response.headers.get("set-auth-jwt");
        },
      },
    });

    if (error || !data?.user) {
      return EMPTY_SESSION;
    }

    return buildSessionPayload({
      user: data.user,
      session: data.session,
      jwtToken: jwt,
    });
  } catch {
    return EMPTY_SESSION;
  }
}

export default function useSession() {
  const hydratedRef = useRef(false);

  const user = useSessionStore((s) => s.user);
  const data = useSessionStore((s) => s.data);
  const token = useSessionStore((s) => s.token);
  const mustChangePassword = useSessionStore((s) => s.mustChangePassword);
  const isPending = useSessionStore((s) => s.isPending);
  const roles = useSessionStore((s) => s.roles);
  const permissions = useSessionStore((s) => s.permissions);

  const setSessionPayload = useSessionStore((s) => s.setSessionPayload);
  const clear = useSessionStore((s) => s.clear);
  const updateUser = useSessionStore((s) => s.updateUser);

  const refreshSession = useCallback(async (): Promise<SessionPayload | null> => {
    const payload = await fetchSession();
    if (payload.user) {
      setSessionPayload(payload);
      return payload;
    }
    clear();
    return null;
  }, [setSessionPayload, clear]);

  const signOut = useCallback(async () => {
    clear();
    return authClient.signOut();
  }, [clear]);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    if (!token) {
      refreshSession();
    }
  }, [token, refreshSession]);

  return {
    user,
    data,
    token,
    mustChangePassword,
    isPending,
    roles,
    permissions,
    setSessionPayload,
    refreshSession,
    signOut,
    updateUser,
    clear,
  };
}
