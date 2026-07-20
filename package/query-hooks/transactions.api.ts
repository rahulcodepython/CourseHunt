"use client";

import { apiRequest } from "@/package/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { PaginatedResponseZod } from "@/package/schema/common.types";
import { TransactionZod, InitiateTransactionRequestZod, InitiateTransactionResponseZod, CheckoutCourseResponseZod, TransactionStatusResponseZod } from "@/package/schema/transactions.types";

export function useTransactionsQuery() {
	return useAppQuery(queryKeys.transactions(), () =>
		apiRequest({ url: "/api/v1/transactions", method: "GET" }, PaginatedResponseZod(TransactionZod)),
	);
}

export function useCheckoutCourseQuery(courseId: string) {
	return useAppQuery(queryKeys.transactionsCheckout(courseId), () =>
		apiRequest({ url: `/api/v1/transactions/checkout/course/${courseId}`, method: "GET" }, CheckoutCourseResponseZod),
	);
}

export function useMyTransactionsQuery(params?: { page?: number; limit?: number }) {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.set("page", params.page.toString());
	if (params?.limit) searchParams.set("limit", params.limit.toString());
	const qs = searchParams.toString();
	const url = qs ? `/api/v1/transactions/me?${qs}` : "/api/v1/transactions/me";
	return useAppQuery(queryKeys.transactionsMe(params), () =>
		apiRequest({ url, method: "GET" }, PaginatedResponseZod(TransactionZod)),
	);
}

export function useTransactionStatusQuery(txId: string, options?: { enabled?: boolean; refetchInterval?: number | false }) {
	return useAppQuery(
		queryKeys.transactionStatus(txId),
		() => apiRequest({ url: `/api/v1/transactions/${txId}/status`, method: "GET" }, TransactionStatusResponseZod),
		options as any,
	);
}

export function useInitiateTransactionMutation() {
	return useSimpleMutation({
		mutationFn: (data: z.infer<typeof InitiateTransactionRequestZod>) =>
			apiRequest({ url: "/api/v1/transactions/initiate", method: "POST", data }, InitiateTransactionResponseZod),
		showToast: false,
	});
}
