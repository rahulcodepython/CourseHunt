import { db } from "@/lib/db";
import { sql } from "kysely";
import type { RolesAndPermissionsResult } from "@/lib/auth.types";

// Single PostgreSQL query using JSON builder to get roles, permissions, and credential status in 1 database call.
export async function getRolesAndPermissions(userId: string): Promise<RolesAndPermissionsResult> {
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
                ),
                'hasCredentialAccount', EXISTS (
                    SELECT 1 FROM accounts WHERE "userId" = ${userId} AND "providerId" = 'credential'
                )
            ) AS data;
        `.execute(db);
    const data = res.rows[0]?.data;
    return {
      roles: Array.isArray(data?.roles) ? data.roles : [],
      permissions: Array.isArray(data?.permissions) ? data.permissions : [],
      hasCredentialAccount: Boolean(data?.hasCredentialAccount),
    };
  } catch {
    return { roles: [], permissions: [], hasCredentialAccount: false };
  }
}

export async function markPasswordChanged(userId: string): Promise<void> {
  await sql`
        UPDATE users SET "passwordChangedAt" = CURRENT_TIMESTAMP WHERE id = ${userId};
    `.execute(db);
}
