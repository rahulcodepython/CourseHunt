"use client";

import { apiRequest, compactParams } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutation";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import { PaginatedResponseZod } from "@/schema/common.types";
import {
  TransactionZod,
  InitiateTransactionRequestZod,
  InitiateTransactionResponseZod,
  CheckoutCourseResponseZod,
  TransactionStatusResponseZod,
  RefundTransactionZod,
} from "@/schema/transactions.types";

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

export function useRefundsQuery(params?: {
  page?: number;
  limit?: number;
  status?: string;
  user_id?: string;
  course_id?: string;
}) {
  return useAppQuery(queryKeys.refunds(params as Record<string, string | number>), () =>
    apiRequest(
      { url: `${API_ENDPOINTS.ADMIN_TRANSACTIONS}/refunds`, method: "GET", params: compactParams(params) },
      PaginatedResponseZod(RefundTransactionZod),
    ),
  );
}

export function useMyRefundsQuery(params?: { page?: number; limit?: number }) {
  return useAppQuery(queryKeys.myRefunds(params as Record<string, string | number>), () =>
    apiRequest(
      { url: `${API_ENDPOINTS.TRANSACTIONS}/refunds/me`, method: "GET", params: compactParams(params) },
      PaginatedResponseZod(RefundTransactionZod),
    ),
  );
}

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
    options as any,
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
