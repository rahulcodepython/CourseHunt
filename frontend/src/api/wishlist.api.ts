"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { useArrayMutation, appendToArray, removeFromArray } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { WishlistItemZod } from "@/types/wishlist.types";
import { DeleteResponseZod } from "@/types/common.types";

export function useWishlistQuery() {
	return useAppQuery(queryKeys.wishlist(), () =>
		apiRequest({ url: "/api/v1/wishlist", method: "GET" }, z.array(WishlistItemZod)),
	);
}

export function useAddCourseToWishlistMutation() {
	return useArrayMutation({
		mutationFn: (courseId: string) =>
			apiRequest({ url: "/api/v1/wishlist", method: "POST", data: { course_id: courseId } }, WishlistItemZod),
		queryKey: queryKeys.wishlist(),
		updater: (item) => appendToArray(item),
		showToast: true,
	});
}

export function useRemoveCourseFromWishlistMutation() {
	return useArrayMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/wishlist/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.wishlist(),
		updater: (res) => removeFromArray(res.id),
		optimistic: (id) => removeFromArray(id),
		showToast: true,
	});
}
