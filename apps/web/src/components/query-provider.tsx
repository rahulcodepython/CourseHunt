"use client";

import {
    QueryCache,
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";

const showErrorToast = (error: Error) => {
    const message = error instanceof Error ? error.message : "Something went wrong";
    toast.error(message);
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                queryCache: new QueryCache({
                    onError: showErrorToast,
                }),
                // No MutationCache.onError here: shared mutation hooks in
                // src/react-query/mutation.ts already toast every mutation
                // error, so wiring it up again would show two error toasts.
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
