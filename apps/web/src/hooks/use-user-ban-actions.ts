"use client";

import { useSessionStore } from "@/store/session.store";
import { hasPermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/const";
import { useBanUserMutation, useUnbanUserMutation } from "@/query-hooks/users.api";

/** Shared ban/unban wiring for the users, tutors, and admins tables. */
export function useUserBanActions() {
    const permissions = useSessionStore((s) => s.permissions);
    const currentUserId = useSessionStore((s) => s.user?.id);
    const canBan = hasPermission(permissions, PERMISSIONS.ADMIN_USERS_BAN);

    const banMutation = useBanUserMutation();
    const unbanMutation = useUnbanUserMutation();

    const handleBanToggle = (user: { id: string; banned?: boolean }) => {
        if (user.banned) {
            unbanMutation.execute({ userId: user.id });
        } else {
            banMutation.execute({ userId: user.id });
        }
    };

    return { canBan, currentUserId, handleBanToggle };
}
