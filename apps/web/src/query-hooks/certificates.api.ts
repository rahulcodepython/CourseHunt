"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { request, compactParams } from "@/react-query/client";

import { usePaginatedMutation, prependToPaginated } from "@/react-query/mutations";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/constants/const";
import { CertificateZod } from "@/schema/certificate.types";
import { PaginatedResponseZod } from "@/schema/common.types";

export function useCertificatesQuery() {
  return useQuery({ queryKey: queryKeys.certificates(), queryFn: () =>
    request(
      { url: API_ENDPOINTS.CERTIFICATES, method: "GET" },
      PaginatedResponseZod(CertificateZod),
    ) });
}

export function useInfiniteCertificatesQuery(params?: { limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.certificates(), "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      request(
        {
          url: API_ENDPOINTS.CERTIFICATES,
          method: "GET",
          params: compactParams({
            ...params,
            page: pageParam,
            limit: params?.limit ?? 10,
          }),
        },
        PaginatedResponseZod(CertificateZod),
      ),
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
}

export function useClaimCertificateMutation() {
  return usePaginatedMutation({
    mutationFn: (courseId: string) =>
      request(
        { url: `${API_ENDPOINTS.CERTIFICATES}/claim/course/${courseId}`, method: "POST" },
        CertificateZod,
      ),
    queryKey: queryKeys.certificates(),
    updater: (cert) => prependToPaginated(cert),
    showToast: true,
  });
}
