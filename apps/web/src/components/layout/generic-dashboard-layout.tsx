"use client";

import { useTheme } from "next-themes";
import * as React from "react";

import { AppSidebar, type NavGroup } from "@/components/layout/app-sidebar";
import BreadcrumbComponent from "@/components/layout/breadcrumb-component";
import { Icon } from "@/components/common/icon";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { filterNavGroups } from "@/lib/auth/permissions";
import { useSessionStore } from "@/store/session.store";
import { UserNav } from "@/components/layout/user-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import Image from "next/image";

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
        <AppSidebar navGroups={navGroups} brandLogo={<Image src={'/logo.png'} alt="Logo" width={1000} height={1000} className="w-10 h-10" />} />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex items-center justify-start gap-3 border-b bg-background/80 p-2 backdrop-blur-md min-w-0">
            <SidebarTrigger className="shrink-0" />
            <div className="min-w-0 flex-1">
              <BreadcrumbComponent />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2 pr-2">
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
