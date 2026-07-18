"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { useSimpleMutation } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { AssignRoleRequestZod, UserListResponseZod, RoleAssignmentResponseZod } from "@/types/users.types";
import { PaginatedResponseZod } from "@/types/common.types";

export function useUsersQuery() {
	return useAppQuery(queryKeys.users(), () =>
		apiRequest({ url: "/api/v1/users", method: "GET" }, PaginatedResponseZod(UserListResponseZod)),
	);
}

export function useAssignRoleMutation() {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
			apiRequest({ url: `/api/v1/users/${id}/roles/assign`, method: "POST", data }, RoleAssignmentResponseZod),
		invalidateKeys: [queryKeys.users()],
		showToast: true,
	});
}

export function useRevokeRoleMutation() {
	return useSimpleMutation({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof AssignRoleRequestZod> }) =>
			apiRequest({ url: `/api/v1/users/${id}/roles/revoke`, method: "POST", data }, RoleAssignmentResponseZod),
		invalidateKeys: [queryKeys.users()],
		showToast: true,
	});
}
