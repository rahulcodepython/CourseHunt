"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation, useObjectMutation } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { AssignRoleRequestZod, UserListResponseZod, RoleAssignmentResponseZod, UserProfileZod, TutorProfileZod, UpdateProfileRequestZod, AdminProfileItemZod, CreateUserRequestZod, CreateUserResponseZod } from "@/package/schema/users.types";
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

export function useAdminProfilesQuery() {
	return useAppQuery(queryKeys.profilesAdmin(), () =>
		apiRequest({ url: "/api/v1/profile/admin", method: "GET" }, PaginatedResponseZod(AdminProfileItemZod)),
	);
}

export function useCreateUserMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof CreateUserRequestZod>) =>
			apiRequest({ url: "/api/v1/auth/create-user", method: "POST", data }, CreateUserResponseZod),
		invalidateKeys: [queryKeys.users()],
		showToast: true,
	});
}

