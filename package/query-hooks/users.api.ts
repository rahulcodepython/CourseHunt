"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation, useObjectMutation } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import {
	AssignRoleRequestZod,
	UserListResponseZod,
	RoleAssignmentResponseZod,
	UserProfileZod,
	TutorProfileZod,
	UpdateProfileRequestZod,
	AdminProfileItemZod,
} from "@/package/schema/users.types";
import { PaginatedResponseZod } from "@/package/schema/common.types";

export function useUsersQuery(params?: Record<string, string | number>) {
	return useAppQuery(queryKeys.users(), () =>
		apiRequest({ url: "/api/v1/users", method: "GET", params }, PaginatedResponseZod(UserListResponseZod)),
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

export function useCreateTutorProfileMutation() {
	return useObjectMutation({
		mutationFn: (data: z.infer<typeof UpdateProfileRequestZod>) =>
			apiRequest({ url: "/api/v1/profile/tutor", method: "POST", data }, TutorProfileZod),
		queryKey: queryKeys.profileTutor(),
		showToast: true,
	});
}

export function useTutorProfileQuery() {
	return useAppQuery(queryKeys.profileTutor(), () =>
		apiRequest({ url: "/api/v1/profile/tutor", method: "GET" }, TutorProfileZod),
	);
}

export function useUserProfileQuery() {
	return useAppQuery(queryKeys.profileUser(), () =>
		apiRequest({ url: "/api/v1/profile/user", method: "GET" }, UserProfileZod),
	);
}

export function useCreateUserProfileMutation() {
	return useObjectMutation({
		mutationFn: (data: z.infer<typeof UpdateProfileRequestZod>) =>
			apiRequest({ url: "/api/v1/profile/user", method: "POST", data }, UserProfileZod),
		queryKey: queryKeys.profileUser(),
		showToast: true,
	});
}

export function useAdminProfilesQuery(params?: Record<string, string | number>) {
	return useAppQuery(queryKeys.profilesAdmin(), () =>
		apiRequest({ url: "/api/v1/profile/admin", method: "GET", params }, PaginatedResponseZod(AdminProfileItemZod)),
	);
}