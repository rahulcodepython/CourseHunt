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
