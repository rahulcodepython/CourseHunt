"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { useSimpleMutation, useArrayMutation, appendToArray, removeFromArray } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { CartItemZod, CreateCartRequestZod } from "@/types/cart.types";
import { SuccessResponseZod, DeleteResponseZod } from "@/types/common.types";

export function useCartQuery() {
	return useAppQuery(queryKeys.cart(), () =>
		apiRequest({ url: "/api/v1/carts", method: "GET" }, z.array(CartItemZod)),
	);
}

export function useClearCartMutation() {
	return useSimpleMutation({
		mutationFn: () =>
			apiRequest({ url: "/api/v1/carts/clear", method: "DELETE" }, SuccessResponseZod),
		invalidateKeys: [queryKeys.cart()],
		showToast: true,
	});
}

export function useAddCourseToCartMutation() {
	return useArrayMutation({
		mutationFn: (data: z.infer<typeof CreateCartRequestZod>) =>
			apiRequest({ url: "/api/v1/carts", method: "POST", data }, CartItemZod),
		queryKey: queryKeys.cart(),
		updater: (item) => appendToArray(item),
		showToast: true,
	});
}

export function useRemoveCourseFromCartMutation() {
	return useArrayMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/carts/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.cart(),
		updater: (res) => removeFromArray(res.id),
		optimistic: (id) => removeFromArray(id),
		showToast: true,
	});
}
