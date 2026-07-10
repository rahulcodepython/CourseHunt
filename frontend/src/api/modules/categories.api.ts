"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { CategoryZod, CreateCategoryRequestZod, UpdateCategoryRequestZod } from "@/types/category.types";


/**
 * Fetches all categories as a tree list.
 */
export function useCategoriesQuery() {
    return useApiQuery(queryKeys.categories(), () =>
        apiRequest({ url: "/api/v1/categories", method: "GET" }, z.array(CategoryZod)),
    );
}

/**
 * Creates a new category.
 * Cache strategy: invalidates since placing nested tree items reliably on client is error-prone.
 */
export function useCreateCategoryMutation() {
    return useApiMutation(
        (data: z.infer<typeof CreateCategoryRequestZod>) =>
            apiRequest({ url: "/api/v1/categories", method: "POST", data }, CategoryZod),
        {
            invalidateKeys: [queryKeys.categories()],
            successMessage: "Category created successfully",
        },
    );
}

/**
 * Deletes a category.
 * Cache strategy: invalidates categories query to ensure tree consistency.
 */
export function useDeleteCategoryMutation() {
    return useApiMutation(
        (id: string) => apiRequest({ url: `/api/v1/categories/${id}`, method: "DELETE" }, z.any()),
        {
            invalidateKeys: [queryKeys.categories()],
            successMessage: "Category deleted successfully",
        },
    );
}

/**
 * Updates an existing category.
 * Cache strategy: invalidates categories query to ensure tree consistency.
 */
export function useUpdateCategoryMutation(id: string) {
    return useApiMutation(
        (data: z.infer<typeof UpdateCategoryRequestZod>) =>
            apiRequest({ url: `/api/v1/categories/${id}`, method: "PATCH", data }, CategoryZod),
        {
            invalidateKeys: [queryKeys.categories()],
            successMessage: "Category updated successfully",
        },
    );
}
