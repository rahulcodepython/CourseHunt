import { db } from "@/lib/db";
import { sql } from "kysely";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { betterAuth } from "better-auth";
import { jwt, admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { ROLES } from "@/lib/const";

const AUTH_SECRET = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET;
if (!AUTH_SECRET) {
    throw new Error(
        "BETTER_AUTH_SECRET (or JWT_SECRET) must be set — refusing to sign sessions with a default secret.",
    );
}

interface RolesAndPermissionsResult {
    roles: string[];
    permissions: string[];
}

interface AuthUser {
    id?: string;
    role?: string;
    banned?: boolean;
    passwordChangedAt?: Date | string | null;
}

// Single PostgreSQL query using JSON builder to get roles and permissions in 1 database call
async function getRolesAndPermissions(userId: string): Promise<RolesAndPermissionsResult> {
    try {
        const res = await sql<{ data: RolesAndPermissionsResult }>`
            SELECT json_build_object(
                'roles', COALESCE(
                    (SELECT json_agg(DISTINCT r.name)
                     FROM roles_user ru
                     JOIN roles r ON r.id = ru.role_id
                     WHERE ru.user_id = ${userId}), '[]'::json
                ),
                'permissions', COALESCE(
                    (SELECT json_agg(DISTINCT p.id)
                     FROM roles_user ru
                     JOIN role_permissions rp ON rp.role_id = ru.role_id
                     JOIN permissions p ON p.id = rp.permission_id
                     WHERE ru.user_id = ${userId}), '[]'::json
                )
            ) AS data;
        `.execute(db);
        const data = res.rows[0]?.data;
        return {
            roles: Array.isArray(data?.roles) ? data.roles : [],
            permissions: Array.isArray(data?.permissions) ? data.permissions : [],
        };
    } catch {
        return { roles: [], permissions: [] };
    }
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
                // Matches the 7-day session lifetime so the HttpOnly JWT cookie
                // survives between page loads without the client polling. Each
                // full page load refreshes it via /api/auth/session.
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
            // Declaring `roles` here only teaches better-auth's own plugin
            // (createUser/setRole typing, banning, impersonation) about the
            // three segments — `tutor` reuses the no-permissions `userAc`
            // shape since it carries none of better-auth's own admin-plugin
            // permissions. The real, modular RBAC (admin:*/tutor:*
            // permissions, roles, roles_user) lives entirely in the backend
            // Postgres tables, resolved separately below.
            roles: {
                [ROLES.ADMIN]: adminAc,
                [ROLES.TUTOR]: userAc,
                [ROLES.USER]: userAc,
            },
        }),
    ],
});
