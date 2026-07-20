import { z } from 'zod';

export const RoleZod = z.object({
    id: z.number(),
    name: z.string(),
});
export type Role = z.infer<typeof RoleZod>;

export const AssignRoleRequestZod = z.object({
    role_id: z.number(),
});
export type AssignRoleRequest = z.infer<typeof AssignRoleRequestZod>;

export const UserListResponseZod = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable().optional(),
    emailVerified: z.boolean(),
    banned: z.boolean(),
    createdAt: z.string(),
    roles: z.array(RoleZod),
});
export type UserListResponse = z.infer<typeof UserListResponseZod>;

export const RoleAssignmentResponseZod = z.object({
    user_id: z.string(),
    role_id: z.number(),
});
export type RoleAssignmentResponse = z.infer<typeof RoleAssignmentResponseZod>;

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
