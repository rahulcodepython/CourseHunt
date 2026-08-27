"use client";

import * as React from "react";

import { useAppQuery } from "@/react-query/query";
import type { ApiResponse } from "@/schema/common.types";
import { mergeListPage } from "@/lib/merge-list-page";

interface FeedItem {
    id: number;
}

export interface CursorPageParams {
    after_id?: number;
    before_id?: number;
    limit: number;
}

/**
 * Drives every cursor-paginated feed in the app (notifications, logs,
 * security events): accumulates pages into a single newest-first list,
 * supports "Load More" (older, via before_id) and "Refresh"/polling (newer,
 * via after_id), and merges either direction into the same list without
 * duplicating or losing items already shown.
 *
 * The "after" cursor is tracked in a ref, not React state, and the query key
 * stays fixed — so refetchInterval polls the same cache entry (no wasted
 * fetch triggered by the cursor advancing) while each invocation still asks
 * the server for "what's new since the last thing I saw".
 */
export function useCursorFeed<T extends FeedItem>(
    queryKey: readonly unknown[],
    fetchPage: (params: CursorPageParams) => Promise<ApiResponse<T[]>>,
    opts?: { limit?: number; refetchInterval?: number },
) {
    const limit = opts?.limit ?? 10;
    const [items, setItems] = React.useState<T[]>([]);
    const [hasMore, setHasMore] = React.useState(true);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const afterIdRef = React.useRef<number | undefined>(undefined);

    const feed = useAppQuery(
        queryKey,
        () => fetchPage({ after_id: afterIdRef.current, limit }),
        { refetchInterval: opts?.refetchInterval, refetchIntervalInBackground: false },
    );

    React.useEffect(() => {
        const page = feed.data?.data;
        if (!page) return;
        setItems((prev) => mergeListPage(prev, page).sort((a, b) => b.id - a.id));
        if (page.length > 0) {
            const maxId = Math.max(...page.map((i) => i.id));
            afterIdRef.current = afterIdRef.current !== undefined ? Math.max(afterIdRef.current, maxId) : maxId;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feed.data]);

    const loadMore = React.useCallback(async () => {
        if (items.length === 0 || loadingMore) return;
        setLoadingMore(true);
        const minId = Math.min(...items.map((i) => i.id));
        const res = await fetchPage({ before_id: minId, limit });
        setLoadingMore(false);
        if (res.success && res.data) {
            setItems((prev) => mergeListPage(prev, res.data!).sort((a, b) => b.id - a.id));
            setHasMore(res.data.length === limit);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, loadingMore, limit]);

    return {
        items,
        loadMore,
        hasMore,
        refresh: () => feed.refetch(),
        isLoading: feed.isLoading,
        isFetching: feed.isFetching || loadingMore,
    };
}
