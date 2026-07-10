import { z } from 'zod';

// ── DB Row Structs ────────────────────────────────────────────────────────────

export const UserZod = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    image: z.string().optional(),
    banned: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type User = z.infer<typeof UserZod>;

export const RoleZod = z.object({
    id: z.number(),
    name: z.string(),
});
export type Role = z.infer<typeof RoleZod>;

// ── Requests ──────────────────────────────────────────────────────────────────

export const AssignRoleRequestZod = z.object({
    role_id: z.number(),
});
export type AssignRoleRequest = z.infer<typeof AssignRoleRequestZod>;

// ── User List Response ────────────────────────────────────────────────────────

export const UserListResponseZod = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().optional(),
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