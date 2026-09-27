import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";

import { queryKeys } from "@/react-query/query-keys";
import { SecurityEventZod, SecurityStatsZod } from "@/schema/security.types";
import { API_ENDPOINTS } from "@/lib/constants/const";
import type { CursorPageParams } from "@/hooks/use-cursor-feed";
import { z } from "zod";

export function fetchSecurityEvents(eventType: string | undefined, params: CursorPageParams) {
  return request(
    {
      url: API_ENDPOINTS.SECURITY_EVENTS,
      method: "GET",
      params: { event_type: eventType, ...params },
    },
    z.array(SecurityEventZod),
  );
}

export function useSecurityStatsQuery(refetchInterval?: number) {
  return useQuery({ queryKey: queryKeys.securityStats(), queryFn: () => request({ url: API_ENDPOINTS.SECURITY_STATS, method: "GET" }, SecurityStatsZod), refetchInterval, refetchIntervalInBackground: false });
}
