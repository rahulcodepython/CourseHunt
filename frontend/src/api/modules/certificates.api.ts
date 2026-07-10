"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation, useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";
import { cache } from "@/api/core/cache-utils";
import { CertificateZod } from "@/types/certificate.types";

/**
 * Fetches all certificates for the user.
 */
export function useCertificatesQuery() {
	return useApiQuery(queryKeys.certificates(), () =>
		apiRequest({ url: "/api/v1/certificates", method: "GET" }, z.array(CertificateZod)),
	);
}

/**
 * Fetches a specific certificate by course ID.
 */
export function useCertificateQuery(courseId: string) {
	return useApiQuery(queryKeys.certificate(courseId), () =>
		apiRequest({ url: `/api/v1/certificates/course/${courseId}`, method: "GET" }, CertificateZod),
	);
}

/**
 * Claims a certificate for a completed course.
 * Cache strategy: appends to certificate list and invalidates detail query if visited previously.
 */
export function useClaimCertificateMutation() {
	return useApiMutation(
		(courseId: string) =>
			apiRequest({ url: `/api/v1/certificates/claim/course/${courseId}`, method: "POST" }, CertificateZod),
		{
			updateCache: {
				queryKey: queryKeys.certificates(),
				updater: cache.append(),
			},
			/* invalidate detail omitted */
			successMessage: "Certificate claimed successfully",
		},
	);
}
