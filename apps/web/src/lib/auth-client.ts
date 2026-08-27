import { createAuthClient } from "better-auth/react";
import { adminClient, customSessionClient, emailOTPClient, twoFactorClient } from "better-auth/client/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { AUTH_CONFIG, ROLES } from "@/lib/const";
import type { auth } from "@/lib/auth";

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
        emailOTPClient(),
        twoFactorClient({
            // After ANY primary sign-in (email OTP or Google) on an account
            // with TOTP enabled, better-auth issues a `twoFactorRedirect`
            // instead of a full session — this sends the browser to the
            // shared challenge page to finish verification.
            twoFactorPage: "/auth/two-factor",
        }),
        // Type-inference only (matches the server's customSession plugin so
        // `permissions` on session.user is typed instead of falling back to
        // `any`) — does not affect the runtime request/response.
        customSessionClient<typeof auth>(),
    ],
});

export default authClient