"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { RoleZod, PermissionZod, CreateRoleRequestZod, UpdateRoleRequestZod, RolePermissionUpdateZod } from "@/schema/roles.types";

export function useRolesQuery() {
    return useAppQuery(queryKeys.roles(), () =>
        apiRequest({ url: "/api/v1/roles", method: "GET" }, z.array(RoleZod)),
    );
}

export function usePermissionsQuery() {
    return useAppQuery(queryKeys.permissions(), () =>
        apiRequest({ url: "/api/v1/permissions", method: "GET" }, z.array(PermissionZod)),
    );
}

export function useCreateRoleMutation() {
    return useSimpleMutation({
        mutationFn: (data: z.infer<typeof CreateRoleRequestZod>) =>
            apiRequest({ url: "/api/v1/roles", method: "POST", data }, RoleZod),
        invalidateKeys: [queryKeys.roles()],
        showToast: true,
    });
}

export function useUpdateRoleMutation() {
    return useSimpleMutation({
        mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateRoleRequestZod> }) =>
            apiRequest({ url: `/api/v1/roles/${id}`, method: "PUT", data }, RoleZod),
        invalidateKeys: [queryKeys.roles()],
        showToast: true,
    });
}

export function useDeleteRoleMutation() {
    return useSimpleMutation({
        mutationFn: (id: string) =>
            apiRequest({ url: `/api/v1/roles/${id}`, method: "DELETE" }, z.any()),
        invalidateKeys: [queryKeys.roles()],
        showToast: true,
    });
}

export function useRolePermissionsQuery(roleId: string) {
    return useAppQuery([...queryKeys.roles(), "permissions", roleId], () =>
        apiRequest({ url: `/api/v1/roles/${roleId}/permissions`, method: "GET" }, z.array(PermissionZod)),
    );
}

export function useUpdateRolePermissionsMutation() {
    return useSimpleMutation({
        mutationFn: ({ id, data }: { id: string; data: z.infer<typeof RolePermissionUpdateZod> }) =>
            apiRequest({ url: `/api/v1/roles/${id}/permissions`, method: "PUT", data }, z.any()),
        invalidateKeys: [queryKeys.roles()],
        showToast: true,
    });
}
