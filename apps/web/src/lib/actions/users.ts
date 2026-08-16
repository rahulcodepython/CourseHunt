"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRolesAndPermissions } from "@/lib/auth-db";
import { hasPermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/const";
import type { ApiResponse } from "@/schema/common.types";

// Custom RBAC permissions (roles/permissions/roles_user) are entirely
// separate from better-auth's own admin/tutor/user segment check — its
// ban-user/unban-user endpoints only require an "admin" segment session.
// These actions add the admin:users:ban gate on top, server-side, before
// ever calling better-auth's native API — the client never calls
// authClient.admin.banUser directly.
async function requireBanPermission(): Promise<string | null> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return "Not authenticated.";

    const { permissions } = await getRolesAndPermissions(session.user.id);
    if (!hasPermission(permissions, PERMISSIONS.ADMIN_USERS_BAN)) {
        return "You don't have permission to ban or unban users.";
    }
    return null;
}

function errorResponse(message: string): ApiResponse<null> {
    return { success: false, message, data: null, error: message };
}

export async function banUserAction(userId: string, banReason?: string): Promise<ApiResponse<null>> {
    const permissionError = await requireBanPermission();
    if (permissionError) return errorResponse(permissionError);

    try {
        // better-auth's own endpoint already rejects self-bans
        // (ADMIN_ERROR_CODES.YOU_CANNOT_BAN_YOURSELF) — no need to duplicate that check.
        await auth.api.banUser({
            body: { userId, banReason: banReason || "Banned by administrator" },
            headers: await headers(),
        });
        return { success: true, message: "User banned successfully.", data: null };
    } catch (err) {
        return errorResponse(err instanceof Error ? err.message : "Failed to ban user.");
    }
}

export async function unbanUserAction(userId: string): Promise<ApiResponse<null>> {
    const permissionError = await requireBanPermission();
    if (permissionError) return errorResponse(permissionError);

    try {
        await auth.api.unbanUser({ body: { userId }, headers: await headers() });
        return { success: true, message: "User unbanned successfully.", data: null };
    } catch (err) {
        return errorResponse(err instanceof Error ? err.message : "Failed to unban user.");
    }
}
