"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { CertificateZod } from "@/types/certificate.types";
import { PaginatedResponseZod } from "@/types/common.types";

export function useCertificatesQuery() {
	return useApiQuery(queryKeys.certificates(), () =>
		apiRequest({ url: "/api/v1/certificates", method: "GET" }, PaginatedResponseZod(CertificateZod)),
	);
}

export function useClaimCertificateMutation() {
	return useApiMutation(
		(courseId: string) =>
			apiRequest({ url: `/api/v1/certificates/claim/course/${courseId}`, method: "POST" }, CertificateZod),
		{
			updateCache: {
				queryKey: queryKeys.certificates(),
				updater: cache.append("data"),
			},
			successMessage: "Certificate claimed successfully",
		},
	);
}
