import { z } from "zod";

import { apiRequest, compactParams } from "@/react-query/client";
import { useAppQuery } from "@/react-query/query";
import { PaginatedResponseZod } from "@/schema/common.types";

/**
 * Builds a `use<X>Query(params?)` hook for the common "plain paginated GET
 * list" shape — a handful of query-hooks files repeat
 * `useAppQuery(queryKeys.x(params), () => apiRequest({url, method:"GET",
 * params}, PaginatedResponseZod(XZod)))` verbatim. Only fits a resource with
 * no extra options (no `enabled`, no non-paginated/wrapped response shape,
 * no extra client-side transform) — anything with real extra logic stays a
 * hand-written hook instead of being forced through this.
 */
export function createListQuery<
  T,
  P extends Record<string, string | number> = Record<string, string | number>,
>(endpoint: string, queryKeyFn: (params?: P) => readonly unknown[], itemSchema: z.ZodType<T>) {
  return function useListQuery(params?: P) {
    return useAppQuery(queryKeyFn(params), () =>
      apiRequest(
        { url: endpoint, method: "GET", params: compactParams(params) },
        PaginatedResponseZod(itemSchema),
      ),
    );
  };
}
