import { apiRequest } from "@/react-query/client";

import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { SecurityEventZod, SecurityStatsZod } from "@/schema/security.types";
import { API_ENDPOINTS } from "@/lib/const";
import type { CursorPageParams } from "@/hooks/use-cursor-feed";
import { z } from "zod";

export function fetchSecurityEvents(eventType: string | undefined, params: CursorPageParams) {
  return apiRequest(
    {
      url: API_ENDPOINTS.SECURITY_EVENTS,
      method: "GET",
      params: { event_type: eventType, ...params },
    },
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
