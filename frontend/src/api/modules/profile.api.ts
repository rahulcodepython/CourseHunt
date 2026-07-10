"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { UserProfileZod, TutorProfileZod, UpdateProfileRequestZod } from "@/types/profile.types";

/**
 * Creates a tutor profile.
 */
export function useCreateTutorProfileMutation() {
	return useApiMutation(
		(data: z.infer<typeof UpdateProfileRequestZod>) =>
			apiRequest({ url: "/api/v1/profile/tutor", method: "POST", data }, TutorProfileZod),
		{
			invalidateKeys: [queryKeys.profileTutor("me")],
			successMessage: "Tutor profile created successfully",
		},
	);
}

/**
 * Fetches a tutor profile by ID.
 */
export function useTutorProfileQuery(id: string) {
	return useApiQuery(queryKeys.profileTutor(id), () =>
		apiRequest({ url: `/api/v1/profile/tutor/${id}`, method: "GET" }, TutorProfileZod),
	);
}

/**
 * Fetches the current user profile.
 */
export function useUserProfileQuery() {
	return useApiQuery(queryKeys.profileUser(), () =>
		apiRequest({ url: "/api/v1/profile/user", method: "GET" }, UserProfileZod),
	);
}

/**
 * Creates or updates user profile.
 */
export function useCreateUserProfileMutation() {
	return useApiMutation(
		(data: z.infer<typeof UpdateProfileRequestZod>) =>
			apiRequest({ url: "/api/v1/profile/user", method: "POST", data }, UserProfileZod),
		{
			updateCache: {
				queryKey: queryKeys.profileUser(),
				updater: cache.replace(),
			},
			successMessage: "User profile updated successfully",
		},
	);
}
