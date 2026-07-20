"use client";

import { AppSidebar } from "@/components/app-sidebar";
import BreadcrumbComponent from "@package/components/breadcrumb";
import { SidebarProvider, SidebarTrigger } from "@package/ui/sidebar";
interface NavGroupType {
    title: string;
    url?: string;
    icon?: React.ComponentType<{ className?: string }>;
    isActive?: boolean;
    items?: NavGroupType[];
    children?: NavGroupType[];
}

interface NavbarDataType {
    navMain: NavGroupType[];
}

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    const data: NavbarDataType = {
        navMain: [
            {
                title: "Platform",
                children: [
                    {
                        title: "Overview",
                        url: "/dashboard",
                    },
                    {
                        title: "Feedback",
                        url: "/dashboard/feedback",
                    },
                    {
                        title: "Transactions",
                        url: "/dashboard/transactions",
                    },
                ],
            }
        ],
    };

    return (
        <SidebarProvider>
            <AppSidebar data={data} />
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
    )
}