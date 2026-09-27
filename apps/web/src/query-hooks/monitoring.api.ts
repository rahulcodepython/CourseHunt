import { useQuery } from "@tanstack/react-query";
import { request } from "@/react-query/client";

import { queryKeys } from "@/react-query/query-keys";
import { MonitoringSnapshotZod } from "@/schema/monitoring.types";
import { API_ENDPOINTS } from "@/lib/constants/const";

export function useMonitoringQuery(refetchInterval?: number) {
  return useQuery({ queryKey: queryKeys.monitoring(), queryFn: () => request({ url: API_ENDPOINTS.MONITORING, method: "GET" }, MonitoringSnapshotZod), refetchInterval, refetchIntervalInBackground: false });
}
