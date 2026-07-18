"use client";

import { Icon } from "@/components/icon";
import { useUserDashboardQuery } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import Loading from "@/components/loading";
import Stats from "@/app/dashboard/stats";
import Courses from "@/app/dashboard/courses";
import Updates from "@/app/dashboard/updates";
import { Suspense } from "react";

export default function StudentDashboard() {
	const { data: responseData, isLoading } = useUserDashboardQuery();

	if (isLoading) return <Loading />;
	if (!responseData) return <div className="p-8">Failed to load dashboard.</div>;

	return (
		<div className="space-y-8 w-full">
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
					<Icon name="IconCalendar" className="w-5 h-5" />
					{new Date().toLocaleDateString(undefined, {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</div>
			</div>

			<div className="space-y-8">
				<Suspense fallback={<Skeleton className="w-full h-32 rounded-xl" />}>
					<Stats />
				</Suspense>

				<div className="grid gap-8 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<Suspense fallback={<Skeleton className="w-full h-[400px] rounded-xl" />}>
							<Courses />
						</Suspense>
					</div>
					<div>
						<Suspense fallback={<Skeleton className="w-full h-[400px] rounded-xl" />}>
							<Updates />
						</Suspense>
					</div>
				</div>
			</div>
		</div>
	);
}
