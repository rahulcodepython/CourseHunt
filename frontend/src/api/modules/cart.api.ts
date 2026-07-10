"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { CartItemZod } from "@/types/cart.types";


import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";

/**
 * Fetches the user's cart items.
 */
export function useCartQuery() {
    return useApiQuery(queryKeys.cart(), () =>

        apiRequest({ url: "/api/v1/cart", method: "GET" }, z.array(CartItemZod)),
    );
}

/**
 * Clears the user's cart entirely.
 * Cache strategy: invalidateKeys to ensure full cart state sync.
 */
export function useClearCartMutation() {
    return useApiMutation(
        () => apiRequest({ url: "/api/v1/cart", method: "DELETE" }, z.any()),
        {
            invalidateKeys: [queryKeys.cart()],
            successMessage: "Cart cleared successfully",
        },
    );
}

/**
 * Adds a course to the user's cart.
 * Cache strategy: appends the new cart item directly to the cart cache.
 */
export function useAddCourseToCartMutation() {
    return useApiMutation(
        (courseId: string) =>
            apiRequest({ url: `/api/v1/cart/course/${courseId}`, method: "POST" }, CartItemZod),
        {
            updateCache: {
                queryKey: queryKeys.cart(),
                updater: cache.append(),
            },
            successMessage: "Course added to cart",
        },
    );
}

/**
 * Removes a course from the user's cart.
 * Cache strategy: removes the matching cart item from the cache directly.
 */
export function useRemoveCourseFromCartMutation() {
    return useApiMutation(
        (courseId: string) =>
            apiRequest({ url: `/api/v1/cart/course/${courseId}`, method: "DELETE" }, z.any()),
        {
            updateCache: {
                queryKey: queryKeys.cart(),
                updater: cache.remove((item: any, courseId) => item.course.id === courseId),
            },
            successMessage: "Course removed from cart",
        },
    );
}
