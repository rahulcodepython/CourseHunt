"use client";

import { AppSidebar } from "@package/components/app-sidebar";
import type { NavGroup } from "@package/components/app-sidebar";
import BreadcrumbComponent from "@package/components/breadcrumb";
import { SidebarProvider, SidebarTrigger } from "@package/ui/sidebar";

const navMain: NavGroup[] = [
  {
    title: "Platform",
    children: [
      { title: "Overview", url: "/dashboard" },
      { title: "Feedback", url: "/dashboard/feedback" },
      { title: "Transactions", url: "/dashboard/transactions" },
    ],
  },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar
        navMain={navMain}
        branding={{ icon: "IconMountain", title: "CourseHunt" }}
        profileHref="/dashboard/profile"
      />
      <main className="w-full min-h-screen">
        <header className="flex items-center justify-start gap-4 p-2">
          <SidebarTrigger />
          <BreadcrumbComponent />
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
