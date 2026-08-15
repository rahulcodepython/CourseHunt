import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { AUTH_CONFIG, ROLES } from "@/lib/const";
import { useSessionStore, type SessionPayload } from "@/store/session.store";
import { decodeJwtPayload } from "@/lib/jwt-decoder";

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

const EMPTY_SESSION: SessionPayload = { user: null, session: null, roles: [], permissions: [], token: null };

// Validates the better-auth session via the native authClient.getSession()
// call, capturing the minted JWT from the set-auth-jwt response header
// (onResponse is the only way to reach a raw header off this call) and
// decoding custom roles/permissions for the client Zustand store.
export async function fetchSession(): Promise<SessionPayload> {
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

        const payload = jwt ? decodeJwtPayload(jwt) : null;

        return {
            user: data.user as SessionPayload["user"],
            session: data.session ?? null,
            roles: payload?.roles ?? [],
            permissions: payload?.permissions ?? [],
            token: jwt,
        };
    } catch {
        return EMPTY_SESSION;
    }
}

// Populates the zustand store once per page load (SessionProvider). Returns
// null when there is no valid session (the store is cleared in that case).
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