import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "CourseHunt | Online Course Selling Platform",
	description: "CourseHunt is an online platform for selling and buying courses, providing a seamless experience for both course creators and learners.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html lang="en" suppressHydrationWarning>
				<body className={` ${montserrat.variable} antialiased`}>
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						enableSystem
						disableTransitionOnChange
					>
						{children}
						{/* <Toaster /> */}
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
