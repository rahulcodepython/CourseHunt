"use client";

import { useQuery } from "@tanstack/react-query";
import { request, compactParams } from "@/react-query/client";
import { z } from "zod";

import { useSimpleMutation } from "@/react-query/mutations";
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
  TutorPayoutOverviewZod,
  TutorPayoutTransactionZod,
  SettlePayoutRequestZod,
} from "@/schema/transactions.types";

export function useTransactionsQuery(
  params?: { page?: number; limit?: number },
  scope: "admin" | "student" = "student",
) {
  const endpoint = scope === "admin" ? API_ENDPOINTS.ADMIN_TRANSACTIONS : API_ENDPOINTS.TRANSACTIONS;
  return useQuery({
    queryKey: queryKeys.transactions(scope),
    queryFn: () =>
      request(
        { url: endpoint, method: "GET", params: compactParams(params) },
        PaginatedResponseZod(TransactionZod),
      ),
  });
}

export function useRefundsQuery(params?: {
  page?: number;
  limit?: number;
  status?: string;
  user_id?: string;
  course_id?: string;
}) {
  return useQuery({
    queryKey: queryKeys.refunds(params as Record<string, string | number>),
    queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.ADMIN_TRANSACTIONS}/refunds`, method: "GET", params: compactParams(params) },
        PaginatedResponseZod(RefundTransactionZod),
      ),
  });
}

export function useMyRefundsQuery(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.myRefunds(params as Record<string, string | number>),
    queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.TRANSACTIONS}/refunds/me`, method: "GET", params: compactParams(params) },
        PaginatedResponseZod(RefundTransactionZod),
      ),
  });
}

export function useCheckoutCourseQuery(courseId: string) {
  return useQuery({
    queryKey: queryKeys.transactionsCheckout(courseId),
    queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.TRANSACTIONS}/checkout/course/${courseId}`, method: "GET" },
        CheckoutCourseResponseZod,
      ),
  });
}

export function useTransactionStatusQuery(
  txId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: queryKeys.transactionStatus(txId),
    queryFn: () =>
      request(
        { url: `${API_ENDPOINTS.TRANSACTIONS}/${txId}/status`, method: "GET" },
        TransactionStatusResponseZod,
      ),
    ...options,
  });
}

export function useInitiateTransactionMutation() {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof InitiateTransactionRequestZod>) =>
      request(
        { url: API_ENDPOINTS.TRANSACTIONS_INITIATE, method: "POST", data },
        InitiateTransactionResponseZod,
      ),
    showToast: false,
  });
}

export function useTutorPayoutOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.tutorPayouts(),
    queryFn: () =>
      request(
        { url: API_ENDPOINTS.TUTOR_PAYOUTS, method: "GET" },
        TutorPayoutOverviewZod,
      ),
  });
}

export function useRequestPayoutMutation() {
  return useSimpleMutation({
    mutationFn: () =>
      request(
        { url: `${API_ENDPOINTS.TUTOR_PAYOUTS}/request`, method: "POST" },
        z.object({ message: z.string().optional() }),
      ),
    invalidateKeys: [queryKeys.tutorPayouts()],
  });
}

export function useAdminPayoutsQuery(params?: {
  page?: number;
  limit?: number;
  status?: string;
  tutor_id?: string;
}) {
  return useQuery({
    queryKey: queryKeys.adminPayouts(params as Record<string, string | number>),
    queryFn: () =>
      request(
        { url: API_ENDPOINTS.ADMIN_PAYOUTS, method: "GET", params: compactParams(params) },
        PaginatedResponseZod(TutorPayoutTransactionZod),
      ),
  });
}

export function useSettlePayoutMutation(payoutId: string) {
  return useSimpleMutation({
    mutationFn: (data: z.infer<typeof SettlePayoutRequestZod>) =>
      request(
        { url: `${API_ENDPOINTS.ADMIN_PAYOUTS}/${payoutId}/settle`, method: "POST", data },
        z.object({ message: z.string().optional() }),
      ),
    invalidateKeys: [queryKeys.adminPayouts()],
  });
}
