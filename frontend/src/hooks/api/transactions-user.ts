"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiQuery } from "./generics";
import { queryKeys } from "./query-keys";

// =============================================================================
// Schemas
// =============================================================================

const TransactionSchema = z.object({
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
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches transactions for the current user.
 */
export function useUserTransactionsQuery() {
	return useApiQuery(queryKeys.userTransactions(), () =>
		apiRequest(
			{
				url: "/api/v1/transactions/user",
				method: "GET",
			},
			z.array(TransactionSchema),
		),
	);
}
