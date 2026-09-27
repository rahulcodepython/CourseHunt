"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";
import { z } from "zod";

import {
  useArrayMutation,
  appendToArray,
  replaceInArray,
  removeFromArray,
} from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import {
  Category,
  CategoryZod,
  CreateCategoryRequestZod,
  UpdateCategoryRequestZod,
} from "@/schema/category.types";
import { DeleteResponse, DeleteResponseZod, PaginatedResponseZod } from "@/schema/common.types";

export function useCategoriesQuery() {
  return useQuery({ queryKey: queryKeys.categories(), queryFn: () =>
    request(
      { url: API_ENDPOINTS.CATEGORIES, method: "GET" },
      z.union([z.array(CategoryZod), PaginatedResponseZod(CategoryZod)]),
    ) });
}

export function useCreateCategoryMutation() {
  return useArrayMutation<Category, z.infer<typeof CreateCategoryRequestZod>, Category>({
    mutationFn: (data: z.infer<typeof CreateCategoryRequestZod>) =>
      request({ url: API_ENDPOINTS.CATEGORIES, method: "POST", data }, CategoryZod),
    queryKey: queryKeys.categories(),
    updater: (newCat) => appendToArray(newCat),
    showToast: true,
  });
}

export function useDeleteCategoryMutation() {
  return useArrayMutation<DeleteResponse, string, Category>({
    mutationFn: (id: string) =>
      request({ url: `${API_ENDPOINTS.CATEGORIES}/${id}`, method: "DELETE" }, DeleteResponseZod),
    queryKey: queryKeys.categories(),
    updater: (res) => removeFromArray(res.id),
    showToast: true,
  });
}

export function useUpdateCategoryMutation() {
  return useArrayMutation<
    Category,
    { id: string; data: z.infer<typeof UpdateCategoryRequestZod> },
    Category
  >({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof UpdateCategoryRequestZod> }) =>
      request({ url: `${API_ENDPOINTS.CATEGORIES}/${id}`, method: "PATCH", data }, CategoryZod),
    queryKey: queryKeys.categories(),
    updater: (updatedCat) => replaceInArray(updatedCat),
    showToast: true,
  });
}
