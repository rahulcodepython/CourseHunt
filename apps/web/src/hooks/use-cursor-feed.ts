"use client";

import * as React from "react";
import type { QueryKey } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";

interface FeedItem {
  id: number;
}

export interface CursorPageParams {
  after_id?: number;
  before_id?: number;
  limit: number;
}

/**
 * Uses TanStack React Query's official useInfiniteQuery for cursor-paginated feeds
 * (notifications, logs, security events). Outsources pagination state and cache
 * deduplication directly to TanStack Query.
 */
export function useCursorFeed<T extends FeedItem>(
  queryKey: QueryKey,
  fetchPage: (params: CursorPageParams) => Promise<T[] | { data?: T[] }>,
  opts?: { limit?: number; refetchInterval?: number },
) {
  const limit = opts?.limit ?? 10;

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await fetchPage({ before_id: pageParam, limit });
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: T[]) => {
      if (!lastPage || lastPage.length < limit) return undefined;
      return lastPage[lastPage.length - 1]?.id;
    },
    refetchInterval: opts?.refetchInterval,
    refetchIntervalInBackground: false,
  });

  const items = React.useMemo(() => {
    if (!query.data?.pages) return [];
    const seen = new Set<number>();
    const list: T[] = [];
    for (const page of query.data.pages) {
      for (const item of page) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    return list;
  }, [query.data?.pages]);

  return {
    items,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    },
    hasMore: Boolean(query.hasNextPage),
    refresh: () => query.refetch(),
    isLoading: query.isLoading,
    isFetching: query.isFetching || query.isFetchingNextPage,
  };
}
