"use client";

import { apiRequest } from "@/lib/client";
import { z } from "zod";

import { useSimpleMutation } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { PaginatedResponseZod } from "@/types/common.types";
import { TransactionZod, InitiateTransactionRequestZod, InitiateTransactionResponseZod } from "@/types/transactions.types";

export function useTransactionsQuery() {
	return useAppQuery(queryKeys.transactions(), () =>
		apiRequest({ url: "/api/v1/transactions", method: "GET" }, PaginatedResponseZod(TransactionZod)),
	);
}

export function useMyTransactionsQuery() {
	return useAppQuery(queryKeys.transactionsMe(), () =>
		apiRequest({ url: "/api/v1/transactions/me", method: "GET" }, PaginatedResponseZod(TransactionZod)),
	);
}

export function useInitiateTransactionMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof InitiateTransactionRequestZod>) =>
			apiRequest({ url: "/api/v1/transactions/initiate", method: "POST", data }, InitiateTransactionResponseZod),
		showToast: true,
	});
}
