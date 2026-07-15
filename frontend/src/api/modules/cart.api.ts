"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { CartItemZod, CartItem, CreateCartRequestZod } from "@/types/cart.types";
import { SuccessResponseZod, DeleteResponseZod } from "@/types/common.types";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";

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
            invalidateKeys: [queryKeys.cart()],
            successMessage: "Course added to cart",
        },
    );
}

export function useRemoveCourseFromCartMutation() {
    return useApiMutation(
        (id: string) =>
            apiRequest({ url: `/api/v1/carts/${id}`, method: "DELETE" }, DeleteResponseZod),
        {
            invalidateKeys: [queryKeys.cart()],
            successMessage: "Course removed from cart",
        },
    );
}
