"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
import { WishlistItemZod } from "@/types/wishlist.types";
import { DeleteResponseZod } from "@/types/common.types";

export function useWishlistQuery() {
	return useApiQuery(queryKeys.wishlist(), () =>
		apiRequest({ url: "/api/v1/wishlist", method: "GET" }, z.array(WishlistItemZod)),
	);
}

export function useAddCourseToWishlistMutation() {
	return useApiMutation(
		(courseId: string) =>
			apiRequest({ url: "/api/v1/wishlist", method: "POST", data: { course_id: courseId } }, WishlistItemZod),
		{
			invalidateKeys: [queryKeys.wishlist()],
			successMessage: "Course added to wishlist",
		},
	);
}

export function useRemoveCourseFromWishlistMutation() {
	return useApiMutation(
		(id: string) =>
			apiRequest({ url: `/api/v1/wishlist/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			invalidateKeys: [queryKeys.wishlist()],
			successMessage: "Course removed from wishlist",
		},
	);
}
