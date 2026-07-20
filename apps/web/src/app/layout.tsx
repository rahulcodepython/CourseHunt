import { ThemeProvider } from "@package/components/theme-provider";
import { QueryProvider } from "@package/components/query-provider";
import { BannedGuard } from "@package/components/banned-guard";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Montserrat } from "next/font/google"
import { cn } from "@package/lib/utils";
import "@package/styles/globals.css"

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
	title: "CourseHunt | Online Course Selling Platform",
	description: "CourseHunt is an online platform for selling and buying courses, providing a seamless experience for both course creators and learners.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn("antialiased", montserrat.variable)}
		>
			<body className="antialiased">
				<QueryProvider>
					<ThemeProvider>
						<BannedGuard>
							{children}
						</BannedGuard>
						<Toaster />
					</ThemeProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
