"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiMutation } from "@/api/core/use-api-mutation";
import { useApiQuery } from "@/api/core/use-api-query";
import { queryKeys } from "@/api/query-keys";
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
			invalidateKeys: [queryKeys.certificates()],
			successMessage: "Certificate claimed successfully",
		},
	);
}
