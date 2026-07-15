"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { AssignRoleRequestZod, UserListResponseZod, RoleAssignmentResponseZod } from "@/types/users.types";
import { PaginatedResponseZod } from "@/types/common.types";

export function useUsersQuery() {
	return useApiQuery(queryKeys.users(), () =>
		apiRequest({ url: "/api/v1/users", method: "GET" }, PaginatedResponseZod(UserListResponseZod)),
	);
}

export function useAssignRoleMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
			apiRequest({ url: `/api/v1/users/${id}/roles/assign`, method: "POST", data }, RoleAssignmentResponseZod),
		{
			invalidateKeys: [queryKeys.users()],
			successMessage: "Role assigned successfully",
		},
	);
}

export function useRevokeRoleMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
			apiRequest({ url: `/api/v1/users/${id}/roles/revoke`, method: "POST", data }, RoleAssignmentResponseZod),
		{
			invalidateKeys: [queryKeys.users()],
			successMessage: "Role revoked successfully",
		},
	);
}
