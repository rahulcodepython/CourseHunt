"use client";

import { useTheme } from "next-themes";
import * as React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbComponent } from "@/components/breadcrumb-component";
import { Icon } from "@/components/icon";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex items-center justify-start gap-4 border-b bg-background/80 p-2 backdrop-blur-md">
            <SidebarTrigger />
            <BreadcrumbComponent />
            <div className="ml-auto flex items-center gap-1 pr-2">
              <ThemeToggle />
            </div>
          </header>
          <section className="flex-1 p-8">{children}</section>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
