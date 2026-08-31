"use client";

import navStudentGroups from "@/config/nav-student.json";
import { GenericDashboardLayout } from "@/components/generic-dashboard-layout";
import type { NavGroup } from "@/components/app-sidebar";

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <GenericDashboardLayout rawNavGroups={navStudentGroups as NavGroup[]}>
      {children}
    </GenericDashboardLayout>
  );
}
