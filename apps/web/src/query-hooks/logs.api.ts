import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { LogEntryZod } from "@/schema/logs.types";
import { API_ENDPOINTS } from "@/lib/const";
import type { CursorPageParams } from "@/hooks/use-cursor-feed";

function buildQuery(params: CursorPageParams): string {
    const search = new URLSearchParams();
    if (params.after_id !== undefined) search.set("after_id", String(params.after_id));
    if (params.before_id !== undefined) search.set("before_id", String(params.before_id));
    search.set("limit", String(params.limit));
    return search.toString();
}

export function fetchLogs(params: CursorPageParams) {
    return apiRequest(
        { url: `${API_ENDPOINTS.LOGS}?${buildQuery(params)}`, method: "GET" },
        z.array(LogEntryZod),
    );
}
