"use client"
import { AppSidebar } from "@/components/app-sidebar";
import BreadcrumbComponent from "@/components/breadcrumb";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavbarDataType } from "@/types/navbar.type";
import { SquareTerminal } from "lucide-react";

export default function UserLayout({ children }: { children: React.ReactNode }) {

    const data: NavbarDataType = {
        navMain: [
            {
                title: "Platform",
                children: [
                    {
                        title: "Course",
                        url: "#",
                        icon: SquareTerminal,
                        isActive: true,
                        items: [
                            {
                                title: "My Courses",
                                url: "/user/my-courses",
                            },
                        ],
                    },
                    {
                        title: "Feedback",
                        url: "#",
                        icon: SquareTerminal,
                        isActive: true,
                        items: [
                            {
                                title: "Feedback",
                                url: "/user/feedback",
                            },
                        ],
                    },
                    {
                        title: "Transaction",
                        url: "#",
                        icon: SquareTerminal,
                        isActive: true,
                        items: [
                            {
                                title: "Transactions",
                                url: "/user/transactions",
                            },
                        ],
                    },
                ]
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
                <section className="p-8 flex">
                    {children}
                </section>
            </main>
        </SidebarProvider>
    )
}