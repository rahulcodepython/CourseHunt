"use client";

import { z } from "zod";
import { apiRequest } from "@/package/react-query/client";
import { useSimpleMutation, useObjectMutation } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import {
	LoginRequestZod,
	GoogleLoginRequestZod,
	ChangePasswordRequestZod,
	TokenResponseZod,
	CreateUserRequestZod,
	CreateUserResponseZod,
} from "@/package/schema/auth.types";

export function useAuthSessionQuery() {
	return useAppQuery(
		queryKeys.authSession(),
		() => apiRequest({ url: "/api/v1/auth/refresh", method: "POST" }, TokenResponseZod),
		{
			retry: false,
			refetchOnWindowFocus: false,
		}
	);
}

export function useLoginWithEmailMutation() {
	return useObjectMutation({
		mutationFn: (data: z.infer<typeof LoginRequestZod>) =>
			apiRequest({ url: "/api/v1/auth/login", method: "POST", data }, TokenResponseZod),
		queryKey: queryKeys.authSession(),
		showToast: true,
	});
}

export function useLoginWithGoogleMutation() {
	return useObjectMutation({
		mutationFn: (data: z.infer<typeof GoogleLoginRequestZod>) =>
			apiRequest({ url: "/api/v1/auth/google", method: "POST", data }, TokenResponseZod),
		queryKey: queryKeys.authSession(),
		showToast: true,
	});
}

export function useLogoutMutation() {
	return useSimpleMutation({
		mutationFn: () =>
			apiRequest({ url: "/api/v1/auth/logout", method: "POST" }, z.unknown()),
		invalidateKeys: [queryKeys.authSession(), queryKeys.me()],
		showToast: true,
	});
}

export function useCreateUserMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof CreateUserRequestZod>) =>
			apiRequest({ url: "/api/v1/auth/user", method: "POST", data }, CreateUserResponseZod),
		invalidateKeys: [queryKeys.users()],
		showToast: true,
	});
}

export function useChangePasswordMutation() {
	return useObjectMutation({
		mutationFn: (data: z.infer<typeof ChangePasswordRequestZod>) =>
			apiRequest({ url: "/api/v1/auth/change-password", method: "POST", data }, TokenResponseZod),
		queryKey: queryKeys.authSession(),
		showToast: true,
	});
}

const UpdateUserRequestZod = z.object({
	name: z.string().optional(),
	image: z.string().nullable().optional(),
});

export function useUpdateUserMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof UpdateUserRequestZod>) =>
			apiRequest({ url: "/api/v1/auth/user", method: "PATCH", data }, TokenResponseZod),
		invalidateKeys: [queryKeys.authSession(), queryKeys.me()],
		showToast: true,
	});
}

export async function signOut() {
	try {
		await apiRequest({ url: "/api/v1/auth/logout", method: "POST" }, z.unknown());
	} finally {
		if (typeof window !== "undefined") {
			window.location.href = "/auth/login";
		}
	}
}
