"use client";

import { apiRequest } from "@package/react-query/client";
import { z } from "zod";

import { useArrayMutation, appendToArray, replaceInArray, removeFromArray } from "@package/react-query/mutation";
import { useAppQuery } from "@package/react-query/query";
import { queryKeys } from "@package/react-query/query-keys";
import { CategoryZod, CreateCategoryRequestZod, UpdateCategoryRequestZod } from "@package/schema/category.types";
import { DeleteResponseZod } from "@package/schema/common.types";

export function useCategoriesQuery() {
	return useAppQuery(queryKeys.categories(), () =>
		apiRequest({ url: "/api/v1/categories", method: "GET" }, z.array(CategoryZod)),
	);
}

export function useCreateCategoryMutation() {
	return useArrayMutation({
		mutationFn: (data: z.infer<typeof CreateCategoryRequestZod>) =>
			apiRequest({ url: "/api/v1/categories", method: "POST", data }, CategoryZod),
		queryKey: queryKeys.categories(),
		updater: (cat) => appendToArray(cat),
		showToast: true,
	});
}

export function useDeleteCategoryMutation() {
	return useArrayMutation({
		mutationFn: (id: string) =>
			apiRequest({ url: `/api/v1/categories/${id}`, method: "DELETE" }, DeleteResponseZod),
		queryKey: queryKeys.categories(),
		updater: (res) => removeFromArray(res.id),
		optimistic: (id) => removeFromArray(id),
		showToast: true,
	});
}

export function useUpdateCategoryMutation(id: string) {
	return useArrayMutation({
		mutationFn: (data: z.infer<typeof UpdateCategoryRequestZod>) =>
			apiRequest({ url: `/api/v1/categories/${id}`, method: "PATCH", data }, CategoryZod),
		queryKey: queryKeys.categories(),
		updater: (cat) => replaceInArray(cat as any),
		showToast: true,
	});
}
