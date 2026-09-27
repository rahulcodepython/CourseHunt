import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/schema/common.types";

export function useApiMutation<TResponse, TVariables = void, TItem = any>(opts: {
  mutationFn: (vars: TVariables) => Promise<TResponse>;
  queryKey?: QueryKey;
  invalidateKeys?: QueryKey[] | ((data: TResponse, vars: TVariables) => QueryKey[]);
  updater?: (old: any, data: TResponse, vars: TVariables) => any;
  optimistic?: (vars: TVariables) => any;
  successMessage?: string | ((data: TResponse) => string);
  errorMessage?: string | ((err: unknown) => string);
  silent?: boolean;
  showToast?: boolean;
}) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: opts.mutationFn,
    meta: {
      successMessage: opts.successMessage,
      errorMessage: opts.errorMessage,
      silent: opts.silent ?? (opts.showToast === false ? true : undefined),
    },
    onSuccess: (data, vars) => {
      if (opts.queryKey && opts.updater && data !== undefined) {
        qc.setQueryData(opts.queryKey, (old: any) => {
          const res = opts.updater!(old, data, vars);
          if (typeof res === "function") {
            return res(old);
          }
          return res;
        });
      } else if (opts.queryKey) {
        qc.invalidateQueries({ queryKey: opts.queryKey });
      }
      if (opts.invalidateKeys) {
        const keys =
          typeof opts.invalidateKeys === "function"
            ? opts.invalidateKeys(data, vars)
            : opts.invalidateKeys;
        keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      }
    },
  });

  const execute = async (vars: TVariables) => {
    try {
      const res = await mutation.mutateAsync(vars);
      if (typeof res === "object" && res !== null) {
        return Object.assign({ success: true, data: res }, res);
      }
      return { success: true, data: res };
    } catch {
      return null;
    }
  };

  return Object.assign(mutation, { execute });
}

// ── Cache Updaters ──
export const listUpdaters = {
  add: <T>(old: T[] = [], item: T): T[] => [...old, item],
  update: <T extends { id: string | number }>(old: T[] = [], item: T): T[] =>
    old.map((i) => (i.id === item.id ? item : i)),
  remove: <T extends { id: string | number }>(old: T[] = [], id: string | number): T[] =>
    old.filter((i) => i.id !== id),
};

export const paginatedUpdaters = {
  add: <T>(old: PaginatedResponse<T>, item: T): PaginatedResponse<T> => ({
    ...old,
    data: [item, ...(old?.data ?? [])],
    total: (old?.total ?? 0) + 1,
  }),
  update: <T extends { id: string | number }>(old: PaginatedResponse<T>, item: T): PaginatedResponse<T> => ({
    ...old,
    data: (old?.data ?? []).map((i) => (i.id === item.id ? item : i)),
  }),
  remove: <T extends { id: string | number }>(old: PaginatedResponse<T>, id: string | number): PaginatedResponse<T> => ({
    ...old,
    data: (old?.data ?? []).filter((i) => i.id !== id),
    total: Math.max(0, (old?.total ?? 1) - 1),
  }),
};

// Curried helpers for backwards compatibility
export const appendToArray = <T>(item: T) => (old: T[] = []) => listUpdaters.add(old, item);
export const prependToArray = <T>(item: T) => (old: T[] = []) => listUpdaters.add(old, item);
export const replaceInArray =
  <T extends { id: string | number }>(
    item: T,
    opts?: { matches?: (i: T) => boolean; appendIfMissing?: boolean },
  ) =>
  (old: T[] = []): T[] => {
    const matches = opts?.matches ?? ((i: T) => i.id === item.id);
    const index = old.findIndex(matches);
    if (index === -1) return opts?.appendIfMissing ? [...old, item] : old;
    const next = [...old];
    next[index] = item;
    return next;
  };
export const removeFromArray = <T extends { id: string | number }>(id: string | number) => (old: T[] = []) =>
  listUpdaters.remove(old, id);

export const appendToPaginated = <T>(item: T) => (old: PaginatedResponse<T>) => paginatedUpdaters.add(old, item);
export const prependToPaginated = <T>(item: T) => (old: PaginatedResponse<T>) => paginatedUpdaters.add(old, item);
export const replaceInPaginated = <T extends { id: string | number }>(item: T) => (old: PaginatedResponse<T>) =>
  paginatedUpdaters.update(old, item);
export const removeFromPaginated = <T extends { id: string | number }>(id: string | number) => (old: PaginatedResponse<T>) =>
  paginatedUpdaters.remove(old, id);

export const useSimpleMutation = useApiMutation;
export const useObjectMutation = useApiMutation;
export const useArrayMutation = useApiMutation;
export const usePaginatedMutation = useApiMutation;
