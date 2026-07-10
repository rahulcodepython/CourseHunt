"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { AssignRoleRequestZod, RoleAssignmentResponseZod, UserListResponseZod } from "@/types/users.types";

/**
 * Fetches all users (for admin).
 */
export function useUsersQuery() {
	return useApiQuery(queryKeys.users(), () =>
		apiRequest({ url: "/api/v1/users", method: "GET" }, UserListResponseZod),
	);
}

/**
 * Assigns a role to a user.
 */
export function useAssignRoleMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
			apiRequest({ url: `/api/v1/users/${id}/roles/assign`, method: "POST", data }, RoleAssignmentResponseZod),
		{
			successMessage: "Role assigned successfully",
		},
	);
}

/**
 * Revokes a role from a user.
 */
export function useRevokeRoleMutation() {
	return useApiMutation(
		({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
			apiRequest({ url: `/api/v1/users/${id}/roles/revoke`, method: "POST", data }, RoleAssignmentResponseZod),
		{
			successMessage: "Role revoked successfully",
		},
	);
}
