"use client";

import { useEffect, useRef } from "react";
import { useBreadcrumbStore, type BreadcrumbItemData } from "@/store/breadcrumb.store";

export function useSetBreadcrumbs(items: BreadcrumbItemData[]) {
  const setBreadcrumbs = useBreadcrumbStore((s) => s.setBreadcrumbs);
  const prevKeyRef = useRef<string>("");

  useEffect(() => {
    const key = items.map((i) => `${i.label}:${i.href ?? ""}`).join("|");
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      setBreadcrumbs(items);
    }
  });
}
