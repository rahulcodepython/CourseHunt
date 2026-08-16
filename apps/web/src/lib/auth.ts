import { db } from "@/lib/db";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { betterAuth } from "better-auth";
import { jwt, admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { ROLES } from "@/lib/const";
import { getRolesAndPermissions, markPasswordChanged } from "@/lib/auth-db";
import type { AuthUser } from "@/lib/auth.types";

const AUTH_SECRET = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET;

if (!AUTH_SECRET) {
    throw new Error(
        "BETTER_AUTH_SECRET (or JWT_SECRET) must be set — refusing to sign sessions with a default secret.",
    );
}

export const auth = betterAuth({
    secret: AUTH_SECRET,
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    database: kyselyAdapter(db, { usePlural: true }),
    user: {
        additionalFields: {
            passwordChangedAt: {
                type: "date",
                required: false,
                input: false,
            },
        },
    },
    databaseHooks: {
        account: {
            update: {
                after: async (account) => {
                    if (account.providerId !== "credential" || !account.password) return;
                    await markPasswordChanged(account.userId as string);
                },
            },
        },
    },
    advanced: {
        database: {
            generateId: false,
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    plugins: [
        jwt({
            jwt: {
                expirationTime: "7d",
                definePayload: async ({ user }: { user: AuthUser }) => {
                    let roles: string[] = [];
                    let permissions: string[] = [];
                    let mustChangePassword = false;

                    if (user?.id) {
                        const authData = await getRolesAndPermissions(user.id);
                        roles = authData.roles;
                        permissions = authData.permissions;

                        if (
                            (user.role === ROLES.ADMIN || user.role === ROLES.TUTOR) &&
                            !user.passwordChangedAt
                        ) {
                            mustChangePassword = authData.hasCredentialAccount;
                        }
                    }

                    return {
                        sub: user?.id,
                        user_id: user?.id,
                        role: user?.role,
                        roles,
                        permissions,
                        banned: Boolean(user?.banned),
                        must_change_password: mustChangePassword,
                    };
                },
            },
        }),
        admin({
            defaultRole: ROLES.USER,
            adminRoles: [ROLES.ADMIN],
            roles: {
                [ROLES.ADMIN]: adminAc,
                [ROLES.TUTOR]: userAc,
                [ROLES.USER]: userAc,
            },
        }),
    ],
});
