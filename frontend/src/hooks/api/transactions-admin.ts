"use client";

import { apiRequest } from "@/lib/api";
import { z } from "zod";
import { useApiQuery, useApiMutation } from "./generics";
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
	status: z.string(),
});

const TransactionAdminResponseSchema = z.object({
	transactions: z.array(TransactionSchema),
	stats: z.object({
		totalRevenue: z.number(),
		totalRefunds: z.number(),
		refundsCount: z.number(),
	}),
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetches all transactions for admin.
 */
export function useAdminTransactionsQuery() {
	return useApiQuery(queryKeys.adminTransactions(), () =>
		apiRequest(
			{
				url: "/api/v1/transactions/admin",
				method: "GET",
			},
			TransactionAdminResponseSchema,
		),
	);
}

export function useAcceptRefundMutation() {
	return useApiMutation(
		(id: number) =>
			apiRequest({
				url: `/api/v1/transactions/admin/${id}/accept`,
				method: "PATCH",
			}, z.null()),
		{
			invalidateKeys: [queryKeys.adminTransactions()],
			successMessage: "Refund accepted successfully",
		}
	);
}

export function useRejectRefundMutation() {
	return useApiMutation(
		(id: number) =>
			apiRequest({
				url: `/api/v1/transactions/admin/${id}/reject`,
				method: "PATCH",
			}, z.null()),
		{
			invalidateKeys: [queryKeys.adminTransactions()],
			successMessage: "Refund rejected successfully",
		}
	);
}
