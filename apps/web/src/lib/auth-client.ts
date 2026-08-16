import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { AUTH_CONFIG, ROLES } from "@/lib/const";

const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? AUTH_CONFIG.DEFAULT_APP_URL,

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

export default authClient