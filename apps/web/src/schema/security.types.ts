import { z } from 'zod';

export const SecurityEventZod = z.object({
    id: z.number(),
    event_type: z.enum(["login", "unauthorized_access", "rate_limit_exceeded"]),
    user_id: z.string().nullable(),
    email: z.string().nullable(),
    ip_address: z.string().nullable(),
    user_agent: z.string().nullable(),
    path: z.string().nullable(),
    created_at: z.string(),
});
export type SecurityEvent = z.infer<typeof SecurityEventZod>;

export const SecurityStatsZod = z.object({
    logins_today: z.number(),
    unauthorized_last_24h: z.number(),
    rate_limit_hits_last_24h: z.number(),
    banned_users: z.number(),
});
export type SecurityStats = z.infer<typeof SecurityStatsZod>;
