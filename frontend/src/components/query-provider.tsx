"use client";

import {
    MutationCache,
    QueryCache,
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";

const showErrorToast = (error: unknown) => {
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
                mutationCache: new MutationCache({
                    onError: showErrorToast,
                }),
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
