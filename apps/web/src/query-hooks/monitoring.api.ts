import { apiRequest } from "@/react-query/client";

import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { MonitoringSnapshotZod } from "@/schema/monitoring.types";
import { API_ENDPOINTS } from "@/lib/const";

export function useMonitoringQuery(refetchInterval?: number) {
  return useAppQuery(
    queryKeys.monitoring(),
    () => apiRequest({ url: API_ENDPOINTS.MONITORING, method: "GET" }, MonitoringSnapshotZod),
    { refetchInterval, refetchIntervalInBackground: false },
  );
}
