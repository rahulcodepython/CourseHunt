"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { CategoryZod, CreateCategoryRequestZod, UpdateCategoryRequestZod } from "@/types/category.types";
import { DeleteResponseZod } from "@/types/common.types";

export function useCategoriesQuery() {
    return useApiQuery(queryKeys.categories(), () =>
        apiRequest({ url: "/api/v1/categories", method: "GET" }, z.array(CategoryZod)),
    );
}

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

export function useDeleteCategoryMutation() {
    return useApiMutation(
        (id: string) => apiRequest({ url: `/api/v1/categories/${id}`, method: "DELETE" }, DeleteResponseZod),
        {
            invalidateKeys: [queryKeys.categories()],
            successMessage: "Category deleted successfully",
        },
    );
}

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
