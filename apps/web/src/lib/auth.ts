import { db } from "@/lib/db";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { betterAuth } from "better-auth";
import { jwt, admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { ROLES } from "@/lib/const";
import { getRolesAndPermissions } from "@/lib/auth-db";
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
        user: {
            update: {
                before: async (user) => {
                    return {
                        data: {
                            ...user,
                            passwordChangedAt: new Date(),
                        },
                    };
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
                // Matches the 7-day session lifetime so the JWT survives between page loads.
                // Each full page load refreshes it via /api/auth/get-session.
                expirationTime: "7d",
                definePayload: async ({ user }: { user: AuthUser }) => {
                    let roles: string[] = [];
                    let permissions: string[] = [];

                    if (user?.id) {
                        const dbRoles = await getRolesAndPermissions(user.id);
                        roles = dbRoles.roles;
                        permissions = dbRoles.permissions;
                    }

                    return {
                        sub: user?.id,
                        user_id: user?.id,
                        role: user?.role,
                        roles,
                        permissions,
                        banned: Boolean(user?.banned),
                        password_changed: Boolean(user?.passwordChangedAt),
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
