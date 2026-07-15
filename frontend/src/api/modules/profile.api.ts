"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
import { UserProfileZod, TutorProfileZod, UpdateProfileRequestZod, AdminProfileItemZod } from "@/types/profile.types";
import { PaginatedResponseZod } from "@/types/common.types";

export function useCreateTutorProfileMutation() {
	return useApiMutation(
		(data: z.infer<typeof UpdateProfileRequestZod>) =>
			apiRequest({ url: "/api/v1/profile/tutor", method: "POST", data }, TutorProfileZod),
		{
			invalidateKeys: [queryKeys.profileTutor()],
			successMessage: "Tutor profile created successfully",
		},
	);
}

export function useTutorProfileQuery() {
	return useApiQuery(queryKeys.profileTutor(), () =>
		apiRequest({ url: "/api/v1/profile/tutor", method: "GET" }, TutorProfileZod),
	);
}

export function useUserProfileQuery() {
	return useApiQuery(queryKeys.profileUser(), () =>
		apiRequest({ url: "/api/v1/profile/user", method: "GET" }, UserProfileZod),
	);
}

export function useCreateUserProfileMutation() {
	return useApiMutation(
		(data: z.infer<typeof UpdateProfileRequestZod>) =>
			apiRequest({ url: "/api/v1/profile/user", method: "POST", data }, UserProfileZod),
		{
			invalidateKeys: [queryKeys.profileUser()],
			successMessage: "User profile updated successfully",
		},
	);
}

export function useAdminProfilesQuery() {
	return useApiQuery(queryKeys.profilesAdmin(), () =>
		apiRequest({ url: "/api/v1/profile/admin", method: "GET" }, PaginatedResponseZod(AdminProfileItemZod)),
	);
}
