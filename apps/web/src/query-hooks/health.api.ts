import { apiRequest } from "@/react-query/client";
import { z } from "zod";
import { useAppQuery } from "@/react-query/query";
import { queryKeys } from "@/react-query/query-keys";
import { API_ENDPOINTS } from "@/lib/const";
import { ServiceStatusZod } from "@/schema/monitoring.types";

export const HealthDataZod = z.object({
  status: z.string(),
  timestamp: z.string().optional(),
  version: z.string().optional(),
  services: z.record(z.string(), ServiceStatusZod).optional(),
});
export type HealthData = z.infer<typeof HealthDataZod>;

export function useHealthQuery(refetchInterval?: number) {
  return useAppQuery(
    queryKeys.health(),
    () => apiRequest({ url: API_ENDPOINTS.HEALTH, method: "GET" }, HealthDataZod),
    { refetchInterval, refetchIntervalInBackground: false, retry: 0 },
  );
}
