import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";
import { SessionProvider } from "@/components/session-provider";

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-montserrat",
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "CourseHunt Admin",
        template: "%s · CourseHunt Admin",
    },
    description: "CourseHunt platform administration dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${montserrat.variable} font-sans`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <QueryProvider>
                        <SessionProvider>
                            {children}
                            <Toaster position="bottom-right" richColors />
                        </SessionProvider>
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
