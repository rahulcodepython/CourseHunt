import { CacheUpdater } from "@/api/core/cache-utils";
import {
    MutationFunctionContext,
    useMutation,
    useQuery,
    useQueryClient,
    type QueryKey,
    type UseMutationOptions,
    type UseQueryOptions,
} from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";


// =============================================================================
// Types
// =============================================================================

/** A single surgical patch to apply to one query's cache on mutation success. */
type CacheUpdate<TData, TVariables> = {
    queryKey: QueryKey;
    updater: CacheUpdater<TData, TVariables>;
};

type UseApiMutationOptions<
    TData,
    TError,
    TVariables,
    TContext = unknown,
> = Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn"
> & {
    /** Query keys to invalidate (refetch from the server) after a successful mutation. */
    invalidateKeys?: QueryKey[];
    /**
     * Surgical cache patches to apply instead of refetching — use this when the
     * mutation response (or variables) already contains everything needed to
     * update the cache locally. See cache-utils.ts for the `cache.*` helpers.
     * Accepts one update or several (e.g. patch a list AND a detail cache).
     */
    updateCache?: CacheUpdate<TData, TVariables> | CacheUpdate<TData, TVariables>[];
    successMessage?: string;
};

// =============================================================================
// Helpers
// =============================================================================

/** Logs query/mutation lifecycle events to the console (dev only). */
const log = {
    success: (source: string, data: unknown) =>
        process.env.NODE_ENV === "development" &&
        console.log(`[${source}] Success:`, data),
    error: (source: string, error: unknown) =>
        process.env.NODE_ENV === "development" &&
        console.error(`[${source}] Failure:`, error),
};

// =============================================================================
// Query Hook
// =============================================================================

/**
 * Thin wrapper around useQuery.
 * Logs success/error states and accepts all standard react-query options.
 */
export function useApiQuery<TData, TError = Error>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>,
    options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
    const query = useQuery<TData, TError>({ queryKey, queryFn, ...options });

    useEffect(() => {
        if (query.isSuccess) log.success("useApiQuery", query.data);
    }, [query.isSuccess, query.data]);
    useEffect(() => {
        if (query.isError) log.error("useApiQuery", query.error);
    }, [query.isError, query.error]);

    return query;
}

// =============================================================================
// Mutation Hook
// =============================================================================

/**
 * Wrapper around useMutation with declarative cache patching and lifecycle logging.
 *
 * - `updateCache` — surgically patch one or more cached queries with the
 *   mutation's result (append/prepend/update/remove/replace), no refetch needed.
 * - `invalidateKeys` — query keys to refetch on success (use for anything
 *   `updateCache` doesn't cover, or as a safety net alongside it).
 * - `onSuccess` / `onError` — forwarded after internal handling.
 * - `execute` — convenience wrapper around mutateAsync that never throws.
 */
export function useApiMutation<
    TData,
    TVariables = void,
    TError = Error,
    TContext = unknown,
>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options?: UseApiMutationOptions<TData, TError, TVariables, TContext>,
) {
    const queryClient = useQueryClient();
    const {
        invalidateKeys,
        updateCache,
        successMessage,
        onSuccess,
        onError,
        ...restOptions
    } = options ?? {};

    // Normalize once per hook call/render instead of re-checking Array.isArray
    // and re-allocating a wrapper array on every single mutation success.
    const cacheUpdates = updateCache
        ? Array.isArray(updateCache)
            ? updateCache
            : [updateCache]
        : null;

    const mutation = useMutation<TData, TError, TVariables, TContext>({
        mutationFn,
        ...restOptions,
        onSuccess: async (
            data: TData,
            variables: TVariables,
            onMutateResult: TContext,
            context: MutationFunctionContext,
        ) => {
            log.success("useApiMutation", data);

            if (cacheUpdates) {
                for (const { queryKey, updater } of cacheUpdates) {
                    queryClient.setQueryData(queryKey, (old: unknown) =>
                        updater(old, data, variables),
                    );
                }
            }

            // Fast path: skip .map/Promise.all overhead for the common single-key case.
            if (invalidateKeys?.length === 1) {
                await queryClient.invalidateQueries({ queryKey: invalidateKeys[0] });
            } else if (invalidateKeys?.length) {
                await Promise.all(
                    invalidateKeys.map((key) =>
                        queryClient.invalidateQueries({ queryKey: key }),
                    ),
                );
            }

            if (successMessage) {
                toast.success(successMessage);
            }
            await onSuccess?.(data, variables, onMutateResult, context);
        },
        onError: async (
            error: TError,
            variables: TVariables,
            onMutateResult: TContext | undefined,
            context: MutationFunctionContext,
        ) => {
            log.error("useApiMutation", error);
            await onError?.(error, variables, onMutateResult, context);
        },
    });

    /**
     * Wraps mutateAsync — returns null instead of throwing on failure.
     * Errors are still surfaced via onError and mutation.isError.
     */
    const execute = useCallback(
        async (variables: TVariables): Promise<TData | null> => {
            try {
                return await mutation.mutateAsync(variables);
            } catch {
                return null;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [mutation.mutateAsync],
    );

    return { ...mutation, execute };
}