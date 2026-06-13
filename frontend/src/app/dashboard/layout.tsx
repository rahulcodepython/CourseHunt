"use client"
import { AppSidebar } from "@/components/app-sidebar";
import BreadcrumbComponent from "@/components/breadcrumb";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavbarDataType } from "@/types/navbar.type";

export default function UserLayout({
    children,
    stats,
    courses,
    updates,
}: {
    children: React.ReactNode;
    stats: React.ReactNode;
    courses: React.ReactNode;
    updates: React.ReactNode;
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
                <div className="p-6 space-y-8">
                    {children}
                    <div className="space-y-8">
                        {stats}
                        <div className="grid gap-8 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                {courses}
                            </div>
                            <div>
                                {updates}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </SidebarProvider>
    )
}