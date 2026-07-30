import { z } from "zod";

export const RoleZod = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    is_system: z.boolean().optional(),
});
export type Role = z.infer<typeof RoleZod>;

export const PermissionZod = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
});
export type Permission = z.infer<typeof PermissionZod>;

export const CreateRoleRequestZod = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});
export type CreateRoleRequest = z.infer<typeof CreateRoleRequestZod>;

export const UpdateRoleRequestZod = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
});
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestZod>;

export const RolePermissionUpdateZod = z.object({
    permission_ids: z.array(z.string()),
});
export type RolePermissionUpdate = z.infer<typeof RolePermissionUpdateZod>;
