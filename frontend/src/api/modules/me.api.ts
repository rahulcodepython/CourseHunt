"use client";

import { apiRequest } from "@/api/client";
import { z } from "zod";

import { useApiQuery } from "@/api/core/generics";
import { queryKeys } from "@/api/query-keys";


/**
 * Fetches the current user's general info.
 */
export function useMeQuery() {
	return useApiQuery(queryKeys.me(), () =>
		apiRequest({ url: "/api/v1/me", method: "GET" }, z.any()),
	);
}

