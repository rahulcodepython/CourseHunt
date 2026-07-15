"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { CartItemZod, CreateCartRequestZod } from "@/types/cart.types";
import { SuccessResponseZod, DeleteResponseZod } from "@/types/common.types";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";

export function useCartQuery() {
    return useApiQuery(queryKeys.cart(), () =>
        apiRequest({ url: "/api/v1/carts", method: "GET" }, z.array(CartItemZod)),
    );
}

export function useClearCartMutation() {
    return useApiMutation(
        () => apiRequest({ url: "/api/v1/carts/clear", method: "DELETE" }, SuccessResponseZod),
        {
            invalidateKeys: [queryKeys.cart()],
            successMessage: "Cart cleared successfully",
        },
    );
}

export function useAddCourseToCartMutation() {
    return useApiMutation(
        (data: z.infer<typeof CreateCartRequestZod>) =>
            apiRequest({ url: "/api/v1/carts", method: "POST", data }, CartItemZod),
        {
            updateCache: {
                queryKey: queryKeys.cart(),
                updater: cache.append(),
            },
            successMessage: "Course added to cart",
        },
	);
}

export function useRemoveCourseFromCartMutation() {
    return useApiMutation(
        (id: string) =>
            apiRequest({ url: `/api/v1/carts/${id}`, method: "DELETE" }, DeleteResponseZod),
        {
            updateCache: {
                queryKey: queryKeys.cart(),
                updater: cache.remove((item: any, id) => item.id === id),
            },
            successMessage: "Course removed from cart",
        },
    );
}
