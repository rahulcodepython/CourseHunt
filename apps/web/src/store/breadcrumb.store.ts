import { create } from "zustand";

export interface BreadcrumbItemData {
  label: string;
  href?: string;
}

export interface CustomBreadcrumbOverride {
  pathname: string;
  items: BreadcrumbItemData[];
}

interface BreadcrumbState {
  items: BreadcrumbItemData[];
  customOverride: CustomBreadcrumbOverride | null;
  setBreadcrumbs: (items: BreadcrumbItemData[]) => void;
  setCustomBreadcrumbs: (pathname: string, items: BreadcrumbItemData[]) => void;
  clearBreadcrumbs: () => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  items: [],
  customOverride: null,
  setBreadcrumbs: (items) => set({ items }),
  setCustomBreadcrumbs: (pathname, items) => set({ customOverride: { pathname, items }, items }),
  clearBreadcrumbs: () => set({ items: [], customOverride: null }),
}));

