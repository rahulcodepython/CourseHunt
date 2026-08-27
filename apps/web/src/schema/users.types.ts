import { z } from 'zod';

export const RoleZod = z.object({
    id: z.string(),
    name: z.string(),
});
export type Role = z.infer<typeof RoleZod>;

export const AssignRoleRequestZod = z.object({
    role_ids: z.array(z.string()).min(1),
});
export type AssignRoleRequest = z.infer<typeof AssignRoleRequestZod>;

export const RoleItemZod = z.union([
    z.object({ id: z.string().optional(), name: z.string() }),
    z.string().transform((name) => ({ id: name, name })),
]);

export const UserListResponseZod = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable().optional(),
    emailVerified: z.boolean().optional(),
    email_verified: z.boolean().optional(),
    role: z.string().optional(),
    banned: z.boolean().optional().default(false),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    roles: z.union([
        z.array(RoleItemZod),
        z.string().transform((r) => [{ id: r, name: r }]),
    ]).nullable().optional().transform((val) => (Array.isArray(val) && val.length > 0 ? val : [])),
});
export type UserListResponse = z.infer<typeof UserListResponseZod>;

export const RoleAssignmentResponseZod = z.object({
    user_id: z.string(),
    role_ids: z.array(z.string()),
});
export type RoleAssignmentResponse = z.infer<typeof RoleAssignmentResponseZod>;

export const ProfileZod = z.object({
    id: z.string(),
    user_id: z.string(),
    headline: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    total_students: z.number().optional(),
    rating_avg: z.number().optional(),
    created_at: z.string().optional(),
    updated_at: z.string(),
});
export type Profile = z.infer<typeof ProfileZod>;

export const UserProfileZod = ProfileZod;
export type UserProfile = Profile;

export const TutorProfileZod = ProfileZod;
export type TutorProfile = Profile;

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

export const CreateUserRequestZod = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["admin", "tutor"]),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestZod>;

export const CreateUserResponseZod = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
});
export type CreateUserResponse = z.infer<typeof CreateUserResponseZod>;
