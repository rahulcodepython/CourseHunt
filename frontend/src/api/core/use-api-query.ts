import {
    useQuery,
    type QueryKey,
    type UseQueryOptions,
} from "@tanstack/react-query";
import { useEffect } from "react";

export const log = {
    success: (source: string, data: object) =>
        process.env.NODE_ENV === "development" &&
        console.log(`[${source}] Success:`, data),
    error: (source: string, error: object) =>
        process.env.NODE_ENV === "development" &&
        console.error(`[${source}] Failure:`, error),
};

export function useApiQuery<TData, TError = Error>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>,
    options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
    const query = useQuery<TData, TError>({ queryKey, queryFn, ...options });

    useEffect(() => {
        if (query.isSuccess) log.success("useApiQuery", query.data as object);
    }, [query.isSuccess, query.data]);
    useEffect(() => {
        if (query.isError) log.error("useApiQuery", query.error as object);
    }, [query.isError, query.error]);

    return query;
}
