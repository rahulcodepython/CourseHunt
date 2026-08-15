"use client";

import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import {
	useArrayMutation,
	appendToArray,
	replaceInArray,
	removeFromArray,
} from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { Category, CategoryZod, CreateCategoryRequestZod, UpdateCategoryRequestZod } from "@/schema/category.types";
import { DeleteResponse, DeleteResponseZod, PaginatedResponseZod } from "@/schema/common.types";

export function useCategoriesQuery() {
	return useAppQuery(queryKeys.categories(), () =>
		apiRequest({ url: "/api/v1/categories", method: "GET" }, z.union([z.array(CategoryZod), PaginatedResponseZod(CategoryZod)])),
	);
}

export function useCreateCategoryMutation() {
	return useArrayMutation<Category, z.infer<typeof CreateCategoryRequestZod>, Category>({
		mutationFn: (data: z.infer<typeof CreateCategoryRequestZod>) =>
			apiRequest({ url: "/api/v1/categories", method: "POST", data }, CategoryZod),
		queryKey: queryKeys.categories(),
		updater: (newCat) => appendToArray(newCat),
		showToast: true,
	});
}

export function useDeleteCategoryMutation() {
	return useArrayMutation<DeleteResponse, string, Category>({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/categories/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.categories(),
		updater: (res) => removeFromArray(res.id),
		showToast: true,
	});
}

export function useUpdateCategoryMutation() {
	return useArrayMutation<Category, { id: string; data: z.infer<typeof UpdateCategoryRequestZod> }, Category>({
		mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateCategoryRequestZod> }) =>
			apiRequest({ url: `/api/v1/categories/${id}`, method: "PATCH", data }, CategoryZod),
		queryKey: queryKeys.categories(),
		updater: (updatedCat) => replaceInArray(updatedCat),
		showToast: true,
	});
}
