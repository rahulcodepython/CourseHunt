"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
import { PaginatedResponseZod } from "@/types/common.types";

import { TransactionZod, InitiateTransactionRequestZod, InitiateTransactionResponseZod } from "@/types/transactions.types";

export function useTransactionsQuery() {
	return useApiQuery(queryKeys.transactions(), () =>
		apiRequest({ url: "/api/v1/transactions", method: "GET" }, PaginatedResponseZod(TransactionZod)),
	);
}

export function useMyTransactionsQuery() {
	return useApiQuery(queryKeys.transactionsMe(), () =>
		apiRequest({ url: "/api/v1/transactions/me", method: "GET" }, PaginatedResponseZod(TransactionZod)),
	);
}

export function useInitiateTransactionMutation() {
	return useApiMutation(
		(data: z.infer<typeof InitiateTransactionRequestZod>) =>
			apiRequest({ url: "/api/v1/transactions/initiate", method: "POST", data }, InitiateTransactionResponseZod),
		{
			successMessage: "Transaction initiated",
		},
	);
}
