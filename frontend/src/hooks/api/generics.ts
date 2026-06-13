"use client";

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

type UseApiMutationOptions<
	TData,
	TError,
	TVariables,
	TContext = unknown,
> = Omit<
	UseMutationOptions<TData, TError, TVariables, TContext>,
	"mutationFn"
> & {
	/** Query keys to invalidate after a successful mutation. */
	invalidateKeys?: QueryKey[];
	successMessage?: string;
};

// =============================================================================
// Helpers
// =============================================================================

/** Logs query/mutation lifecycle events to the console. */
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
 * Wrapper around useMutation with automatic query invalidation and lifecycle logging.
 *
 * - `invalidateKeys` — query keys to invalidate on success.
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
	const { invalidateKeys, successMessage, onSuccess, onError, ...restOptions } =
		options ?? {};

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
			if (invalidateKeys?.length) {
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
