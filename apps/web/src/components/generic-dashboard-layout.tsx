"use client";

import { useTheme } from "next-themes";
import * as React from "react";

import { AppSidebar, type NavGroup } from "@/components/app-sidebar";
import BreadcrumbComponent from "@/components/breadcrumb-component";
import { Icon } from "@/components/icon";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { filterNavGroups } from "@/lib/permissions";
import { useSessionStore } from "@/store/session.store";
import { UserNav } from "@/components/user-nav";
import { NotificationBell } from "@/components/notification-bell";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {mounted && resolvedTheme === "dark" ? (
        <Icon name="sun" className="size-4" />
      ) : (
        <Icon name="moon" className="size-4" />
      )}
    </Button>
  );
}

export function GenericDashboardLayout({
  rawNavGroups,
  children,
}: {
  rawNavGroups: NavGroup[];
  children: React.ReactNode;
}) {
  const permissions = useSessionStore((s) => s.permissions);
  const navGroups = React.useMemo(
    () => filterNavGroups(rawNavGroups, permissions),
    [rawNavGroups, permissions],
  );

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar navGroups={navGroups} />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex items-center justify-start gap-4 border-b bg-background/80 p-2 backdrop-blur-md">
            <SidebarTrigger />
            <BreadcrumbComponent />
            <div className="ml-auto flex items-center gap-2 pr-2">
              <NotificationBell />
              <ThemeToggle />
              <UserNav />
            </div>
          </header>
          <section className="flex-1 p-8">{children}</section>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
