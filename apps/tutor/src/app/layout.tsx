import { ThemeProvider } from "@package/components/theme-provider";
import { QueryProvider } from "@package/components/query-provider";
import { BannedGuard } from "@package/components/banned-guard";
import { TutorGuard } from "@package/components/tutor-guard";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Montserrat } from "next/font/google"
import { cn } from "@package/lib/utils";
import "@package/styles/globals.css"

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
    title: "CourseHunt | Tutor Dashboard",
    description: "CourseHunt tutor dashboard for managing courses, students, and discussions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en" suppressHydrationWarning className={cn("antialiased", montserrat.variable)}>
            <body className="antialiased">
                <QueryProvider>
                    <ThemeProvider>
                        <BannedGuard>
                            <TutorGuard>
                                {children}
                            </TutorGuard>
                        </BannedGuard>
                        <Toaster />
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
