import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { AUTH_CONFIG, ROLES } from "@/lib/const";
import { useSessionStore, type SessionPayload } from "@/store/session.store";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? AUTH_CONFIG.DEFAULT_APP_URL,
    // Mirrors the `roles` shape passed to the server's admin() plugin
    // (src/lib/auth.ts) so createUser/setRole are typed for all three
    // segments (admin/tutor/user), not just better-auth's admin/user default.
    plugins: [
        adminClient({
            roles: {
                [ROLES.ADMIN]: adminAc,
                [ROLES.TUTOR]: userAc,
                [ROLES.USER]: userAc,
            },
        }),
    ],
});

// The single session endpoint: it validates the better-auth session, sets or
// clears the HttpOnly access_token cookie, and returns user + session + roles
// + permissions in one round trip. The JWT itself is never exposed to JS.
export async function fetchSession(): Promise<SessionPayload> {
    const res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
    });
    const json = (await res.json()) as SessionPayload;
    return {
        user: (json.user ?? null) as SessionPayload["user"],
        session: json.session ?? null,
        roles: Array.isArray(json.roles) ? json.roles : [],
        permissions: Array.isArray(json.permissions) ? json.permissions : [],
    };
}

// Populates the zustand store once per page load (SessionProvider) and lets the
// server refresh the HttpOnly JWT cookie. Returns null when there is no valid
// session (the store is cleared in that case).
export async function refreshSession(): Promise<SessionPayload | null> {
    const payload = await fetchSession();
    if (payload.user) {
        useSessionStore.getState().setSessionPayload(payload);
        return payload;
    }
    useSessionStore.getState().clear();
    return null;
}

export async function signOut() {
    useSessionStore.getState().clear();
    return authClient.signOut();
}

export const { signIn, signUp } = authClient;