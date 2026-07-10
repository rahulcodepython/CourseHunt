"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { PaginatedResponseZod } from "@/types/common.types";

import { TransactionZod } from "@/types/transactions.types";
import { InitiateTransactionRequestZod } from "@/types/transactions.types";
import { InitiateTransactionResponseZod } from "@/types/transactions.types";
import { WebhookPayloadZod } from "@/types/transactions.types";

/**
 * Fetches all transactions (for admin).
 */
export function useTransactionsQuery() {
	return useApiQuery(queryKeys.transactions(), () =>
		apiRequest({ url: "/api/v1/transactions", method: "GET" }, PaginatedResponseZod(TransactionZod)),
	);
}

/**
 * Fetches current user's transactions.
 */
export function useMyTransactionsQuery() {
	return useApiQuery(queryKeys.transactionsMe(), () =>
		apiRequest({ url: "/api/v1/transactions/me", method: "GET" }, PaginatedResponseZod(TransactionZod)),
	);
}

/**
 * Initiates a new transaction.
 */
export function useInitiateTransactionMutation() {
	return useApiMutation(
		(data: z.infer<typeof InitiateTransactionRequestZod>) =>
			apiRequest({ url: "/api/v1/transactions/initiate", method: "POST", data }, InitiateTransactionResponseZod),
		{
			successMessage: "Transaction initiated",
		},
	);
}

/**
 * Handles transaction webhooks. (Usually server-side only, included for completeness).
 */
export function useTransactionWebhookMutation() {
	return useApiMutation(
		(data: z.infer<typeof WebhookPayloadZod>) =>
			apiRequest({ url: "/api/v1/transactions/webhook", method: "POST", data }, z.any()),
	);
}
