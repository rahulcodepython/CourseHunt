"use client";

import { PurchaseCourseDataType } from "@/types/purchase.type";
import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiMutation, useApiQuery } from "./generics";
import { queryKeys } from "./query-keys";

// =============================================================================
// Schemas
// =============================================================================

const MediaSchema = z.object({
	url: z.string(),
	fileType: z.string(),
});

const CheckoutInfoSchema = z.object({
	user: z.object({
		_id: z.string(),
		firstName: z.string(),
		lastName: z.string(),
		email: z.string(),
		phone: z.string(),
		address: z.string(),
		city: z.string(),
		country: z.string(),
		zip: z.string(),
	}),
	course: z.object({
		_id: z.number(),
		title: z.string(),
		price: z.number(),
		originalPrice: z.number(),
		imageUrl: MediaSchema,
		category: z.string(),
	}),
});

const PurchaseResponseSchema = z.object({
	transaction: z.object({
		id: z.number(),
		_id: z.number(),
		transactionId: z.string(),
		createdAt: z.string(),
		courseId: z.number().optional(),
		courseName: z.string(),
		userId: z.string().optional(),
		userEmail: z.string().optional(),
		couponId: z.number().nullable().optional(),
		couponCode: z.string(),
		amount: z.number(),
	}),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches user and course info for the checkout page.
 */
export function useCheckoutInfoQuery(id: string) {
	return useApiQuery(
		queryKeys.checkoutInfo(id),
		() =>
			apiRequest(
				{
					url: `/api/v1/checkout/${id}`,
					method: "GET",
				},
				CheckoutInfoSchema,
			),
		{ enabled: !!id },
	);
}

/**
 * Initiates a course purchase.
 */
export function usePurchaseCourseMutation() {
	const mutation = useApiMutation((data: PurchaseCourseDataType) =>
		apiRequest(
			{
				url: "/api/v1/purchase",
				method: "POST",
				data: data,
			},
			PurchaseResponseSchema,
		),
	);

	return {
		...mutation,
		purchaseCourse: mutation.execute,
	};
}
