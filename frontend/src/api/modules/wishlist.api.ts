"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
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
			updateCache: {
				queryKey: queryKeys.wishlist(),
				updater: cache.append(),
			},
			successMessage: "Course added to wishlist",
		},
	);
}

export function useRemoveCourseFromWishlistMutation() {
	return useApiMutation(
		(id: string) =>
			apiRequest({ url: `/api/v1/wishlist/${id}`, method: "DELETE" }, DeleteResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.wishlist(),
				updater: cache.remove((item: any, id) => item.id === id),
			},
			successMessage: "Course removed from wishlist",
		},
	);
}
