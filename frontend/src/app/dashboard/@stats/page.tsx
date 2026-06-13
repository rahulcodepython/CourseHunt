"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserDashboardQuery } from "@/hooks/api";
import { IconBook, IconSchool, IconAward, IconStar, IconTrendingUp } from "@tabler/icons-react";

export default function DashboardStatsSlot() {
	const { data: responseData, isLoading } = useUserDashboardQuery();

	if (isLoading || !responseData) return null;

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
			<Card className="bg-primary/5 border-primary/20">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
					<IconBook className="h-4 w-4 text-primary" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{responseData.enrolledCourses}</div>
					<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
						<IconTrendingUp className="w-3 h-3 text-green-500" />
						+1 from last month
					</p>
				</CardContent>
			</Card>
			<Card className="bg-green-500/5 border-green-500/20">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Completed</CardTitle>
					<IconSchool className="h-4 w-4 text-green-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">0</div>
					<p className="text-xs text-muted-foreground mt-1">Keep going!</p>
				</CardContent>
			</Card>
			<Card className="bg-blue-500/5 border-blue-500/20">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Certificates</CardTitle>
					<IconAward className="h-4 w-4 text-blue-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">0</div>
					<p className="text-xs text-muted-foreground mt-1">Ready to earn</p>
				</CardContent>
			</Card>
			<Card className="bg-amber-500/5 border-amber-500/20">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Learning Points</CardTitle>
					<IconStar className="h-4 w-4 text-amber-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">120</div>
					<p className="text-xs text-muted-foreground mt-1">Top 15% this week</p>
				</CardContent>
			</Card>
		</div>
	);
}
