"use client";

import { apiRequest, compactParams } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import { PaginatedResponseZod } from "@/schema/common.types";
import {
  TransactionZod,
  InitiateTransactionRequestZod,
  InitiateTransactionResponseZod,
  CheckoutCourseResponseZod,
  TransactionStatusResponseZod,
  RefundTransactionZod,
} from "@/schema/transactions.types";

import { createListQuery } from "@/react-query/factory";

export function useTransactionsQuery(
  params?: { page?: number; limit?: number },
  scope: "admin" | "student" = "student",
) {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_TRANSACTIONS : API_ENDPOINTS.TRANSACTIONS;
  return useAppQuery(queryKeys.transactions(scope), () =>
    apiRequest(
      { url: endpoint, method: "GET", params: compactParams(params) },
      PaginatedResponseZod(TransactionZod),
    ),
  );
}

export const useRefundsQuery = createListQuery<{ id: string } & z.infer<typeof RefundTransactionZod>, {
  page?: number;
  limit?: number;
  status?: string;
  user_id?: string;
  course_id?: string;
}>(
  `${API_ENDPOINTS.ADMIN_TRANSACTIONS}/refunds`,
  (params) => queryKeys.refunds(params as Record<string, string | number>),
  RefundTransactionZod,
);

export const useMyRefundsQuery = createListQuery<
  { id: string } & z.infer<typeof RefundTransactionZod>,
  { page?: number; limit?: number }
>(
  `${API_ENDPOINTS.TRANSACTIONS}/refunds/me`,
  (params) => queryKeys.myRefunds(params as Record<string, string | number>),
  RefundTransactionZod,
);

export function useCheckoutCourseQuery(courseId: string) {
  return useAppQuery(queryKeys.transactionsCheckout(courseId), () =>
    apiRequest(
      { url: `${API_ENDPOINTS.TRANSACTIONS}/checkout/course/${courseId}`, method: "GET" },
      CheckoutCourseResponseZod,
    ),
  );
}

export function useTransactionStatusQuery(
  txId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useAppQuery(
    queryKeys.transactionStatus(txId),
    () =>
      apiRequest(
        { url: `${API_ENDPOINTS.TRANSACTIONS}/${txId}/status`, method: "GET" },
        TransactionStatusResponseZod,
      ),
    options,
  );
}

export function useInitiateTransactionMutation() {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof InitiateTransactionRequestZod>) =>
      apiRequest(
        { url: API_ENDPOINTS.TRANSACTIONS_INITIATE, method: "POST", data },
        InitiateTransactionResponseZod,
      ),
    showToast: false,
  });
}
