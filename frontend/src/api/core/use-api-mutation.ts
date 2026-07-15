import {
    MutationFunctionContext,
    useMutation,
    useQueryClient,
    type QueryKey,
    type UseMutationOptions,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import { log } from "@/api/core/use-api-query";



type UseApiMutationOptions<
    TData,
    TError,
    TVariables,
    TContext,
> = Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn"
> & {
    invalidateKeys?: QueryKey[] | ((data: TData, variables: TVariables) => QueryKey[]);
    invalidatePrefixes?: QueryKey[];
    successMessage?: string;
};

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
        invalidatePrefixes,
        successMessage,
        onSuccess,
        onError,
        ...restOptions
    } = options ?? {};

    const mutation = useMutation<TData, TError, TVariables, TContext>({
        mutationFn,
        ...restOptions,
        onSuccess: async (
            data: TData,
            variables: TVariables,
            onMutateResult: TContext,
            context: MutationFunctionContext,
        ) => {

            const keysToInvalidate = typeof invalidateKeys === "function" ? invalidateKeys(data, variables) : invalidateKeys;
            if (keysToInvalidate?.length) await Promise.all(keysToInvalidate.map((key) => queryClient.invalidateQueries({ queryKey: key, exact: true })));
            if (invalidatePrefixes?.length) await Promise.all(invalidatePrefixes.map((key) => queryClient.invalidateQueries({ queryKey: key })));

            await onSuccess?.(data, variables, onMutateResult, context);
        },
        onError: async (
            error: TError,
            variables: TVariables,
            onMutateResult: TContext | undefined,
            context: MutationFunctionContext,
        ) => {
            log.error("useApiMutation", error as object);
            await onError?.(error, variables, onMutateResult, context);
        },
    });

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
