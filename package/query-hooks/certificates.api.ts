"use client";

import { apiRequest } from "@/package/react-query/client";

import { usePaginatedMutation, prependToPaginated } from "@/package/react-query/mutation";
import { useAppQuery } from "@/package/react-query/query";
import { queryKeys } from "@/package/react-query/query-keys";
import { CertificateZod } from "@/package/schema/certificate.types";
import { PaginatedResponseZod } from "@/package/schema/common.types";

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
