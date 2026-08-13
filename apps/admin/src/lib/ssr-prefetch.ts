import { QueryClient, dehydrate, type QueryKey } from "@tanstack/react-query";

export interface PrefetchQueryTarget {
  queryKey: QueryKey;
  queryFn: () => Promise<any>;
}

/**
 * Generic helper to prefetch single or multiple queries on the server
 * and return the dehydrated state for HydrationBoundary.
 */
export async function getDehydratedState(
  targets: PrefetchQueryTarget | PrefetchQueryTarget[]
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  const queryList = Array.isArray(targets) ? targets : [targets];

  await Promise.all(
    queryList.map(({ queryKey, queryFn }) =>
      queryClient.prefetchQuery({ queryKey, queryFn })
    )
  );

  return dehydrate(queryClient);
}
