import { db } from "@/lib/db";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { betterAuth } from "better-auth";
import { jwt, admin, emailOTP, twoFactor, customSession } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { ROLES } from "@/lib/const";
import { getRolesAndPermissions, markPasswordChanged } from "@/lib/auth-db";
import { sendOTPEmail } from "@/lib/mailer";
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
    // better-auth's rate limiter defaults to `enabled: isProduction` — off
    // under `next dev`, which left the credential sign-in endpoint (scrypt
    // password verification, CPU-heavy) open to unlimited brute-force/DoS
    // attempts in every non-prod environment. Force it on everywhere, with a
    // stricter window specifically for the two credential-guessing surfaces
    // (password sign-in and OTP verification) than the general default.
    rateLimit: {
        enabled: true,
        window: 60,
        max: 30,
        customRules: {
            "/sign-in/email": { window: 60, max: 5 },
            "/email-otp/check-verification-otp": { window: 60, max: 5 },
            "/sign-in/email-otp": { window: 60, max: 5 },
        },
    },
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
            redirectURI: process.env.GOOGLE_CALLBACK_URL || undefined,
        },
    },
    plugins: [
        jwt({
            jwt: {
                expirationTime: "7d",
                // Deliberately excludes `permissions`: that array grows with
                // every permission a role holds (an admin with every
                // admin:* permission runs ~1.3KB of strings alone) and, once
                // combined with Chrome's own default request headers, was
                // enough to exceed fasthttp's header read buffer — the
                // backend silently dropped the connection instead of
                // returning a clean error, so every API call from an
                // account with enough permissions failed outright. The Go
                // backend never actually needed this claim: it already
                // re-resolves permissions from the DB on every request (see
                // BaseAuthMiddleware) — the JWT copy was purely a fallback
                // for a transient DB error, not the source of truth. The
                // frontend gets permissions from the session response
                // instead (see the customSession plugin below), which has
                // no such size constraint.
                definePayload: async ({ user }: { user: AuthUser }) => {
                    let roles: string[] = [];
                    let mustChangePassword = false;

                    if (user?.id) {
                        const authData = await getRolesAndPermissions(user.id);
                        roles = authData.roles;

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
        // Passwordless sign-in for students: email a 6-digit code, auto-creates
        // the account (segment defaults to ROLES.USER via the admin plugin
        // above) on first successful verification.
        emailOTP({
            otpLength: 6,
            expiresIn: 300,
            allowedAttempts: 3,
            sendVerificationOTP: async ({ email, otp, type }) => {
                await sendOTPEmail(email, otp, type);
            },
        }),
        // Optional second factor for students who want it: enroll a TOTP
        // authenticator app from account settings. `allowPasswordless: true`
        // is required since students never set a credential password.
        widenTwoFactorGate(
            twoFactor({
                issuer: "CourseHunt",
                allowPasswordless: true,
            }),
        ),
        // Carries `permissions` on the session response (GET /get-session)
        // instead of the JWT — see the definePayload comment above for why.
        // Must be registered last: better-auth resolves same-path endpoint
        // overrides (this plugin replaces the built-in `/get-session`) in
        // plugin registration order, and this needs the final roles/session
        // shape every other plugin above has already settled.
        customSession(async ({ user, session }) => {
            const { permissions } = await getRolesAndPermissions(user.id);
            return { user: { ...user, permissions }, session };
        }),
    ],
});

// better-auth's twoFactor plugin only challenges `/sign-in/email`,
// `/sign-in/username`, and `/sign-in/phone-number` by default (see its
// `hooks.after[0].matcher`) — none of which our students ever hit, since
// they sign in via email OTP or Google. Left as-is, an enabled TOTP factor
// would be silently bypassable by using either of those instead. The
// handler itself only reads `ctx.context.newSession` (set identically by
// every sign-in path via the shared `setSessionCookie` helper), so widening
// the matcher to also cover `/sign-in/email-otp` and the OAuth callback
// `/callback/:id` is enough — no need to touch the (unexported) challenge
// logic itself.
function widenTwoFactorGate(plugin: ReturnType<typeof twoFactor>) {
    const originalMatcher = plugin.hooks.after[0].matcher;
    plugin.hooks.after[0].matcher = (context) =>
        originalMatcher(context) ||
        context.path === "/sign-in/email-otp" ||
        context.path === "/callback/:id";
    return plugin;
}
