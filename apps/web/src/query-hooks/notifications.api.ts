import { apiRequest } from "@/react-query/client";
import { z } from "zod";

import { NotificationZod } from "@/schema/notifications.types";
import { API_ENDPOINTS } from "@/lib/const";
import type { CursorPageParams } from "@/hooks/use-cursor-feed";

export function fetchNotifications(params: CursorPageParams) {
  return apiRequest(
    { url: API_ENDPOINTS.NOTIFICATIONS, method: "GET", params },
    z.array(NotificationZod),
  );
}
