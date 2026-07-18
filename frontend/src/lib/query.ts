import {
	useQuery,
	type QueryKey,
	type UseQueryOptions,
} from "@tanstack/react-query";
import { useEffect } from "react";

// =============================================================================
// Dev Logger
// =============================================================================

const log = {
	success: (source: string, data: object) =>
		process.env.NODE_ENV === "development" &&
		console.log(`[${source}] Success:`, data),
	error: (source: string, error: object) =>
		process.env.NODE_ENV === "development" &&
		console.error(`[${source}] Failure:`, error),
};

// =============================================================================
// Generic Query Hook
// =============================================================================

export function useAppQuery<TData, TError = Error>(
	queryKey: QueryKey,
	queryFn: () => Promise<TData>,
	options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
	const query = useQuery<TData, TError>({ queryKey, queryFn, ...options });

	useEffect(() => {
		if (query.isSuccess) log.success("useAppQuery", query.data as object);
		if (query.isError) log.error("useAppQuery", query.error as object);
	}, [query.isSuccess, query.isError, query.data, query.error]);

	return query;
}
