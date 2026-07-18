"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { AssignRoleRequestZod, UserListResponseZod, RoleAssignmentResponseZod } from "@/package/schema/users.types";
import { PaginatedResponseZod } from "@/package/schema/common.types";

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
