import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@package/components/theme-provider";
import { QueryProvider } from "@package/components/query-provider";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Montserrat } from "next/font/google"
import { cn } from "@package/lib/utils";
import "@package/styles/globals.css"

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
    title: "CourseHunt | Admin Panel",
    description: "CourseHunt admin panel for managing the platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en" suppressHydrationWarning className={cn("antialiased", montserrat.variable)}>
            <body className="antialiased">
                <QueryProvider>
                    <SessionProvider>
                        <ThemeProvider>
                            {children}
                            <Toaster />
                        </ThemeProvider>
                    </SessionProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
