"use client";

import { useEffect, useMemo } from "react";
import { useBreadcrumbStore, type BreadcrumbItemData } from "@/store/breadcrumb.store";

export function useSetBreadcrumbs(items: BreadcrumbItemData[]) {
  const setBreadcrumbs = useBreadcrumbStore((s) => s.setBreadcrumbs);
  const clearBreadcrumbs = useBreadcrumbStore((s) => s.clearBreadcrumbs);

  const serialized = useMemo(() => JSON.stringify(items), [items]);

  useEffect(() => {
    setBreadcrumbs(items);
    return () => {
      clearBreadcrumbs();
    };
  }, [serialized, setBreadcrumbs, clearBreadcrumbs]);
}
