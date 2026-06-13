"use client";

import { useUserDashboardQuery } from "@/hooks/api";
import { IconCalendar } from "@tabler/icons-react";

export default function StudentDashboard() {
	const { data: responseData, isLoading } = useUserDashboardQuery();

	if (isLoading) return <div className="p-8">Loading dashboard...</div>;
	if (!responseData) return <div className="p-8">Failed to load dashboard.</div>;

	return (
		<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 w-full">
			<div className="space-y-1">
				<h2 className="text-3xl font-bold tracking-tight text-white">
					Welcome back, {responseData.user.name}! 👋
				</h2>
				<p className="text-muted-foreground">
					Track your learning progress and upcoming tasks.
				</p>
			</div>
			<div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full w-fit">
				<IconCalendar className="w-4 h-4" />
				{new Date().toLocaleDateString(undefined, {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				})}
			</div>
		</div>
	);
}
