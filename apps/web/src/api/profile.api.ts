"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { useObjectMutation } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { UserProfileZod, TutorProfileZod, UpdateProfileRequestZod, AdminProfileItemZod } from "@/types/profile.types";
import { PaginatedResponseZod } from "@/types/common.types";

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
