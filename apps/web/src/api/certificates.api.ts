"use client";

import { apiRequest } from "@/lib/client";

import { usePaginatedMutation, prependToPaginated } from "@/lib/mutation";
import { useAppQuery } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { CertificateZod } from "@/types/certificate.types";
import { PaginatedResponseZod } from "@/types/common.types";

export function useCertificatesQuery() {
	return useAppQuery(queryKeys.certificates(), () =>
		apiRequest({ url: "/api/v1/certificates", method: "GET" }, PaginatedResponseZod(CertificateZod)),
	);
}

export function useClaimCertificateMutation() {
	return usePaginatedMutation({
		mutationFn: (courseId: string) =>
			apiRequest({ url: `/api/v1/certificates/claim/course/${courseId}`, method: "POST" }, CertificateZod),
		queryKey: queryKeys.certificates(),
		updater: (cert) => prependToPaginated(cert),
		showToast: true,
	});
}
