import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { LogEntryZod } from "@/schema/logs.types";
import { API_ENDPOINTS } from "@/lib/const";
import type { CursorPageParams } from "@/hooks/use-cursor-feed";

export function fetchLogs(params: CursorPageParams) {
  return apiRequest({ url: API_ENDPOINTS.LOGS, method: "GET", params }, z.array(LogEntryZod));
}
