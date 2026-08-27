"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import { RoleZod, PermissionZod, CreateRoleRequestZod, UpdateRoleRequestZod, RolePermissionUpdateZod } from "@/schema/roles.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useRolesQuery() {
    return useAppQuery(queryKeys.roles(), () =>
        apiRequest({ url: API_ENDPOINTS.ROLES, method: "GET" }, z.array(RoleZod)),
    );
}

export function usePermissionsQuery() {
    return useAppQuery(queryKeys.permissions(), () =>
        apiRequest({ url: API_ENDPOINTS.PERMISSIONS, method: "GET" }, z.array(PermissionZod)),
    );
}

export function useCreateRoleMutation() {
    return useSimpleMutation({
        mutationFn: (data: z.infer<typeof CreateRoleRequestZod>) =>
            apiRequest({ url: API_ENDPOINTS.ROLES, method: "POST", data }, RoleZod),
        invalidateKeys: [queryKeys.roles()],
        showToast: true,
    });
}

export function useUpdateRoleMutation() {
    return useSimpleMutation({
        mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateRoleRequestZod> }) =>
            apiRequest({ url: `${API_ENDPOINTS.ROLES}/${id}`, method: "PUT", data }, RoleZod),
        invalidateKeys: [queryKeys.roles()],
        showToast: true,
    });
}

export function useDeleteRoleMutation() {
    return useSimpleMutation({
        mutationFn: (id: string) =>
            apiRequest({ url: `${API_ENDPOINTS.ROLES}/${id}`, method: "DELETE" }, DeleteResponseZod),
        invalidateKeys: [queryKeys.roles()],
        showToast: true,
    });
}

export function useRolePermissionsQuery(roleId: string) {
    return useAppQuery([...queryKeys.roles(), "permissions", roleId], () =>
        apiRequest({ url: `${API_ENDPOINTS.ROLES}/${roleId}/permissions`, method: "GET" }, z.array(PermissionZod)),
    );
}

export function useUpdateRolePermissionsMutation() {
    return useSimpleMutation({
        mutationFn: ({ id, data }: { id: string; data: z.infer<typeof RolePermissionUpdateZod> }) =>
            apiRequest({ url: `${API_ENDPOINTS.ROLES}/${id}/permissions`, method: "PUT", data }, z.object({})),
        invalidateKeys: [queryKeys.roles()],
        showToast: true,
    });
}
