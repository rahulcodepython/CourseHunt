"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { PaginatedResponseZod } from "@/package/schema/common.types";
import { TransactionZod, InitiateTransactionRequestZod, InitiateTransactionResponseZod } from "@/package/schema/transactions.types";

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
