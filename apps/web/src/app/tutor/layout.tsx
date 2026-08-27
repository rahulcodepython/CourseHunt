"use client";

import navTutorGroups from "@/config/nav-tutor.json";
import { GenericDashboardLayout } from "@/components/generic-dashboard-layout";
import type { NavGroup } from "@/components/app-sidebar";

export default function TutorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GenericDashboardLayout rawNavGroups={navTutorGroups as NavGroup[]}>
      {children}
    </GenericDashboardLayout>
  );
}
