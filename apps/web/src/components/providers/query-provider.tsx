"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";
import { ApiError } from "@/react-query/client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            const message = error instanceof ApiError ? error.message : error.message || "Failed to load data";
            toast.error(message);
          },
        }),
        mutationCache: new MutationCache({
          onSuccess: (data, _vars, _ctx, mutation) => {
            if (mutation.meta?.silent === true) return;
            const override = mutation.meta?.successMessage as string | ((d: unknown) => string) | undefined;
            const msg = override ? (typeof override === "function" ? override(data) : override) : undefined;
            if (msg) toast.success(msg);
          },
          onError: (error, _vars, _ctx, mutation) => {
            if (mutation.meta?.silent === true) return;
            const override = mutation.meta?.errorMessage as string | ((e: unknown) => string) | undefined;
            const msg = override
              ? typeof override === "function" ? override(error) : override
              : error instanceof ApiError ? error.message : error?.message || "Something went wrong";
            toast.error(msg);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
