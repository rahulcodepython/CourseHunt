"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation, useArrayMutation, appendToArray, removeFromArray } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { WishlistItemZod } from "@/package/schema/wishlist.types";
import { SuccessResponseZod, DeleteResponseZod } from "@/package/schema/common.types";

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

export function useClearWishlistMutation() {
	return useSimpleMutation({
		mutationFn: () =>
			apiRequest({ url: "/api/v1/wishlist", method: "DELETE" }, SuccessResponseZod),
		invalidateKeys: [queryKeys.wishlist()],
		showToast: true,
	});
}
