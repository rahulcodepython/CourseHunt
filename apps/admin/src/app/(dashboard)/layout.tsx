"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@package/ui/sidebar";
import { Button } from "@package/ui/button";
import { TooltipProvider } from "@package/ui/tooltip";
import { Icon } from "@package/components/icon";
import BreadcrumbComponent from "@package/components/breadcrumb";

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
        <Icon name="IconSun" className="size-4" />
      ) : (
        <Icon name="IconMoon" className="size-4" />
      )}
    </Button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
                    <section className="flex-1 p-8">
                        {children}
                    </section>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}
