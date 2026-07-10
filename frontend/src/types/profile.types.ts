import { z } from 'zod';

// ── DB Row Structs ────────────────────────────────────────────────────────────

export const UserProfileZod = z.object({
    id: z.string(),
    user_id: z.string(),
    headline: z.string().optional(),
    bio: z.string().optional(),
    website: z.string().optional(),
    updated_at: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileZod>;

export const TutorProfileZod = z.object({
    id: z.string(),
    user_id: z.string(),
    headline: z.string().optional(),
    bio: z.string().optional(),
    website: z.string().optional(),
    total_students: z.number(),
    rating_avg: z.number(),
    updated_at: z.string(),
});
export type TutorProfile = z.infer<typeof TutorProfileZod>;

// ── Auth / Profile ────────────────────────────────────────────────────────────

export const UpdateProfileRequestZod = z.object({
    headline: z.string().optional(),
    bio: z.string().optional(),
    website: z.string().optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestZod>;