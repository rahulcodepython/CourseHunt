"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import {
  RoleZod,
  RoleOptionZod,
  PermissionZod,
  CreateRoleRequestZod,
  UpdateRoleRequestZod,
  RolePermissionUpdateZod,
} from "@/schema/roles.types";
import { DeleteResponseZod } from "@/schema/common.types";

export function useRolesQuery() {
  return useQuery({ queryKey: queryKeys.roles(), queryFn: () =>
    request({ url: API_ENDPOINTS.ROLES, method: "GET" }, z.array(RoleZod)) });
}

export function useRoleOptionsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.rolesOptions(),
    queryFn: () => request({ url: API_ENDPOINTS.ROLES_OPTIONS, method: "GET" }, z.array(RoleOptionZod)),
    enabled: options?.enabled ?? true,
  });
}

export function usePermissionsQuery() {
  return useQuery({ queryKey: queryKeys.permissions(), queryFn: () =>
    request({ url: API_ENDPOINTS.PERMISSIONS, method: "GET" }, z.array(PermissionZod)) });
}

export function useCreateRoleMutation() {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof CreateRoleRequestZod>) =>
      request({ url: API_ENDPOINTS.ROLES, method: "POST", data }, RoleZod),
    invalidateKeys: [queryKeys.roles()],
    showToast: true,
  });
}

export function useUpdateRoleMutation() {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateRoleRequestZod> }) =>
      request({ url: `${API_ENDPOINTS.ROLES}/${id}`, method: "PUT", data }, RoleZod),
    invalidateKeys: [queryKeys.roles()],
    showToast: true,
  });
}

export function useDeleteRoleMutation() {
  return useSimpleMutation({
    mutationFn: (id: string) =>
      request({ url: `${API_ENDPOINTS.ROLES}/${id}`, method: "DELETE" }, DeleteResponseZod),
    invalidateKeys: [queryKeys.roles()],
    showToast: true,
  });
}

export function useRolePermissionsQuery(roleId?: string | null) {
  return useQuery({
    queryKey: [...queryKeys.roles(), "permissions", roleId],
    queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.ROLES}/${roleId}/permissions`, method: "GET" },
        z.array(PermissionZod),
      ),
    enabled: Boolean(roleId),
  });
}

export function useUpdateRolePermissionsMutation() {
  return useSimpleMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof RolePermissionUpdateZod> }) =>
      request(
        { url: `${API_ENDPOINTS.ROLES}/${id}/permissions`, method: "PUT", data },
        z.object({}),
      ),
    invalidateKeys: [queryKeys.roles()],
    showToast: true,
  });
}
