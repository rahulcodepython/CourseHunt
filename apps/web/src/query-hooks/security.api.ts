import { apiRequest } from "@/react-query/client";

import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { SecurityEventZod, SecurityStatsZod } from "@/schema/security.types";
import { API_ENDPOINTS } from "@/lib/const";
import type { CursorPageParams } from "@/hooks/use-cursor-feed";
import { z } from "zod";

function buildQuery(eventType: string | undefined, params: CursorPageParams): string {
    const search = new URLSearchParams();
    if (eventType) search.set("event_type", eventType);
    if (params.after_id !== undefined) search.set("after_id", String(params.after_id));
    if (params.before_id !== undefined) search.set("before_id", String(params.before_id));
    search.set("limit", String(params.limit));
    return search.toString();
}

export function fetchSecurityEvents(eventType: string | undefined, params: CursorPageParams) {
    return apiRequest(
        { url: `${API_ENDPOINTS.SECURITY_EVENTS}?${buildQuery(eventType, params)}`, method: "GET" },
        z.array(SecurityEventZod),
    );
}

export function useSecurityStatsQuery(refetchInterval?: number) {
    return useAppQuery(
        queryKeys.securityStats(),
        () => apiRequest({ url: API_ENDPOINTS.SECURITY_STATS, method: "GET" }, SecurityStatsZod),
        { refetchInterval, refetchIntervalInBackground: false },
    );
}
