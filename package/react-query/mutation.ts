import {
	useMutation,
	useQueryClient,
	type QueryKey,
	type QueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import type { ApiResponse, PaginatedResponse } from "@/package/schema/common.types";

// =============================================================================
// Types
// =============================================================================

type Identifiable = { id: string };

type CacheUpdater<T> = (old: T) => T;

/** Rollback snapshot — typed to the exact cache shape it was taken from. */
type Snapshot<T> = { queryKey: QueryKey; data: ApiResponse<T> | undefined };

// =============================================================================
// Array Updaters
// =============================================================================

export const appendToArray = <T>(item: T): CacheUpdater<T[]> =>
	(old) => [...old, item];

export const prependToArray = <T>(item: T): CacheUpdater<T[]> =>
	(old) => [item, ...old];

export const replaceInArray = <T extends Identifiable>(item: T): CacheUpdater<T[]> =>
	(old) => old.map((i) => (i.id === item.id ? item : i));

export const removeFromArray = <T extends Identifiable>(id: string): CacheUpdater<T[]> =>
	(old) => old.filter((i) => i.id !== id);

// =============================================================================
// Paginated Updaters
// =============================================================================

export const appendToPaginated = <T>(item: T): CacheUpdater<PaginatedResponse<T>> =>
	(old) => ({ ...old, data: [...old.data, item], total: old.total + 1 });

export const prependToPaginated = <T>(item: T): CacheUpdater<PaginatedResponse<T>> =>
	(old) => ({ ...old, data: [item, ...old.data], total: old.total + 1 });

export const replaceInPaginated = <T extends Identifiable>(item: T): CacheUpdater<PaginatedResponse<T>> =>
	(old) => ({ ...old, data: old.data.map((i) => (i.id === item.id ? item : i)) });

export const removeFromPaginated = <T extends Identifiable>(id: string): CacheUpdater<PaginatedResponse<T>> =>
	(old) => ({ ...old, data: old.data.filter((i) => i.id !== id), total: old.total - 1 });

// =============================================================================
// Internal Helpers
// =============================================================================

/** Update the inner `.data` field of a cached ApiResponse. */
function applyUpdater<T>(
	queryClient: QueryClient,
	queryKey: QueryKey,
	updater: CacheUpdater<T>,
) {
	queryClient.setQueryData(queryKey, (cached: ApiResponse<T> | undefined) => {
		if (cached?.data == null) return cached;
		return { ...cached, data: updater(cached.data) };
	});
}

/** Validate response. Returns unwrapped data on success, null on failure. */
function handleResponse<T>(response: ApiResponse<T>, showToast?: boolean): T | null {
	if (!response.success) {
		console.error("[Mutation]", response.error);
		toast.error(response.message);
		return null;
	}
	if (showToast) toast.success(response.message);
	return response.data ?? null;
}

/** Log and toast the error. */
function handleError(error: Error) {
	console.error("[Mutation]", error.message);
	toast.error(error.message);
}

/**
 * Shared `execute` wrapper used by every mutation hook below. Removes four
 * copies of the same try/catch + useCallback boilerplate.
 */
function useWithExecute<TData, TVars, TContext>(
	mutation: UseMutationResult<ApiResponse<TData>, Error, TVars, TContext>,
) {
	const execute = useCallback(
		async (variables: TVars): Promise<ApiResponse<TData> | null> => {
			try { return await mutation.mutateAsync(variables); }
			catch { return null; }
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[mutation.mutateAsync],
	);

	return { ...mutation, execute };
}

// =============================================================================
// useSimpleMutation — no cache update, optional invalidation
// =============================================================================

export function useSimpleMutation<TData, TVars = void>(opts: {
	mutationFn: (vars: TVars) => Promise<ApiResponse<TData>>;
	invalidateKeys?: QueryKey[] | ((data: TData, vars: TVars) => QueryKey[]);
	showToast?: boolean;
}) {
	const queryClient = useQueryClient();

	const mutation = useMutation<ApiResponse<TData>, Error, TVars>({
		mutationFn: opts.mutationFn,
		onSuccess: async (response, vars) => {
			const data = handleResponse(response, opts.showToast);
			if (data == null) return;
			if (opts.invalidateKeys) {
				const keys = typeof opts.invalidateKeys === "function"
					? opts.invalidateKeys(data, vars) : opts.invalidateKeys;
				await Promise.all(keys.map((k) => queryClient.invalidateQueries({ queryKey: k })));
			}
		},
		onError: handleError,
	});

	return useWithExecute(mutation);
}

// =============================================================================
// useObjectMutation — replace a single object at one query key
// =============================================================================

export function useObjectMutation<TData, TVars = void>(opts: {
	mutationFn: (vars: TVars) => Promise<ApiResponse<TData>>;
	queryKey: QueryKey;
	showToast?: boolean;
}) {
	const queryClient = useQueryClient();

	const mutation = useMutation<ApiResponse<TData>, Error, TVars>({
		mutationFn: opts.mutationFn,
		onSuccess: (response) => {
			const data = handleResponse(response, opts.showToast);
			if (data != null) queryClient.setQueryData(opts.queryKey, response);
		},
		onError: handleError,
	});

	return useWithExecute(mutation);
}

// =============================================================================
// useCacheMutation — shared core for list-shaped caches (array or paginated)
// at a single query key, with optional optimistic update + rollback.
//
// useArrayMutation and usePaginatedMutation are identical in structure
// (same onMutate/onSuccess/onError), differing only in the cache shape
// (TItem[] vs PaginatedResponse<TItem>) — so both are thin wrappers over this.
// TCache is threaded through Snapshot<TCache> so rollback data keeps its
// real type instead of being widened to `unknown`.
// =============================================================================

function useCacheMutation<TData, TVars, TCache>(opts: {
	mutationFn: (vars: TVars) => Promise<ApiResponse<TData>>;
	queryKey: QueryKey;
	updater: (data: TData) => CacheUpdater<TCache>;
	optimistic?: (vars: TVars) => CacheUpdater<TCache>;
	invalidateKeys?: QueryKey[];
	showToast?: boolean;
}) {
	const queryClient = useQueryClient();

	const mutation = useMutation<ApiResponse<TData>, Error, TVars, Snapshot<TCache> | undefined>({
		mutationFn: opts.mutationFn,

		onMutate: async (vars) => {
			if (!opts.optimistic) return undefined;
			await queryClient.cancelQueries({ queryKey: opts.queryKey });
			const snapshot: Snapshot<TCache> = {
				queryKey: opts.queryKey,
				data: queryClient.getQueryData<ApiResponse<TCache>>(opts.queryKey),
			};
			applyUpdater(queryClient, opts.queryKey, opts.optimistic(vars));
			return snapshot;
		},

		onSuccess: async (response) => {
			const data = handleResponse(response, opts.showToast);
			if (data != null) applyUpdater(queryClient, opts.queryKey, opts.updater(data));
			if (opts.invalidateKeys) {
				await Promise.all(opts.invalidateKeys.map((k) =>
					queryClient.invalidateQueries({ queryKey: k }),
				));
			}
		},

		onError: (error, _vars, snapshot) => {
			handleError(error);
			if (snapshot) queryClient.setQueryData(snapshot.queryKey, snapshot.data);
		},
	});

	return useWithExecute(mutation);
}

// =============================================================================
// useArrayMutation — update array cache at one query key
// =============================================================================

export function useArrayMutation<TData, TVars = void, TItem = never>(opts: {
	mutationFn: (vars: TVars) => Promise<ApiResponse<TData>>;
	queryKey: QueryKey;
	updater: (data: TData) => CacheUpdater<TItem[]>;
	optimistic?: (vars: TVars) => CacheUpdater<TItem[]>;
	invalidateKeys?: QueryKey[];
	showToast?: boolean;
}) {
	return useCacheMutation<TData, TVars, TItem[]>(opts);
}

// =============================================================================
// usePaginatedMutation — update paginated cache at one query key
// =============================================================================

export function usePaginatedMutation<TData, TVars = void, TItem = never>(opts: {
	mutationFn: (vars: TVars) => Promise<ApiResponse<TData>>;
	queryKey: QueryKey;
	updater: (data: TData) => CacheUpdater<PaginatedResponse<TItem>>;
	optimistic?: (vars: TVars) => CacheUpdater<PaginatedResponse<TItem>>;
	invalidateKeys?: QueryKey[];
	showToast?: boolean;
}) {
	return useCacheMutation<TData, TVars, PaginatedResponse<TItem>>(opts);
}