"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useBreadcrumbStore, type BreadcrumbItemData } from "@/store/breadcrumb.store";

export function useSetBreadcrumbs(
  items: BreadcrumbItemData[] | null | undefined,
  enabled: boolean = true,
) {
  const pathname = usePathname();
  const setBreadcrumbs = useBreadcrumbStore((s) => s.setBreadcrumbs);
  const setCustomBreadcrumbs = useBreadcrumbStore((s) => s.setCustomBreadcrumbs);
  const prevKeyRef = useRef<string>("");

  useEffect(() => {
    if (!enabled || !items) return;
    const key = `${pathname}::` + items.map((i) => `${i.label}:${i.href ?? ""}`).join("|");
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      setBreadcrumbs(items);
      setCustomBreadcrumbs(pathname, items);
    }
  }, [enabled, items, pathname, setBreadcrumbs, setCustomBreadcrumbs]);
}

