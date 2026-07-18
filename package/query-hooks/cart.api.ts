"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation, useArrayMutation, appendToArray, removeFromArray } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { CartItemZod, CreateCartRequestZod } from "@/package/schema/cart.types";
import { SuccessResponseZod, DeleteResponseZod } from "@/package/schema/common.types";

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
