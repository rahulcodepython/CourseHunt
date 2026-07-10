"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { WishlistZod } from "@/types/wishlist.types";

// TODO: added WishlistRemoveResponseZod — verify shape against api-docs.md
import { WishlistRemoveResponseZod } from "@/types/wishlist.types";

/**
 * Fetches the user's wishlist.
 */
export function useWishlistQuery() {
	return useApiQuery(queryKeys.wishlist(), () =>
		apiRequest({ url: "/api/v1/wishlist", method: "GET" }, z.array(WishlistZod)),
	);
}

/**
 * Adds a course to wishlist.
 * Cache strategy: appends to wishlist cache.
 */
export function useAddCourseToWishlistMutation() {
	return useApiMutation(
		(courseId: string) =>
			apiRequest({ url: `/api/v1/wishlist/course/${courseId}`, method: "POST" }, WishlistZod),
		{
			updateCache: {
				queryKey: queryKeys.wishlist(),
				updater: cache.append(),
			},
			successMessage: "Course added to wishlist",
		},
	);
}

/**
 * Removes a course from wishlist.
 * Cache strategy: removes matching item from wishlist cache.
 */
export function useRemoveCourseFromWishlistMutation() {
	return useApiMutation(
		(courseId: string) =>
			apiRequest({ url: `/api/v1/wishlist/course/${courseId}`, method: "DELETE" }, WishlistRemoveResponseZod),
		{
			updateCache: {
				queryKey: queryKeys.wishlist(),
				updater: cache.remove((item: any, courseId) => item.course_id === courseId),
			},
			successMessage: "Course removed from wishlist",
		},
	);
}
