"use client";

import navAdminGroups from "@/config/nav-admin.json";
import { GenericDashboardLayout } from "@/components/generic-dashboard-layout";
import type { NavGroup } from "@/components/app-sidebar";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GenericDashboardLayout rawNavGroups={navAdminGroups as NavGroup[]}>
      {children}
    </GenericDashboardLayout>
  );
}
