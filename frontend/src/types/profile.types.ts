import { z } from 'zod';

export const UserProfileZod = z.object({
    id: z.string(),
    user_id: z.string(),
    headline: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    updated_at: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileZod>;

export const TutorProfileZod = z.object({
    id: z.string(),
    user_id: z.string(),
    headline: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    total_students: z.number(),
    rating_avg: z.number(),
    updated_at: z.string(),
});
export type TutorProfile = z.infer<typeof TutorProfileZod>;

export const UpdateProfileRequestZod = z.object({
    headline: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestZod>;

export const AdminProfileItemZod = z.object({
    id: z.string(),
    user_id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.string(),
    headline: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    total_students: z.number().nullable().optional(),
    rating_avg: z.number().nullable().optional(),
    updated_at: z.string(),
});
export type AdminProfileItem = z.infer<typeof AdminProfileItemZod>;
