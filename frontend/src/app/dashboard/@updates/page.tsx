"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useUnseenUpdatesQuery } from "@/hooks/api/updates-hooks";

export default function DashboardUpdatesSlot() {
	const { data: updates, isLoading } = useUnseenUpdatesQuery();

	if (isLoading) return null;

	return (
		<Card className="h-full shadow-sm">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Recent Updates</CardTitle>
					<Badge variant="outline">Latest</Badge>
				</div>
				<CardDescription>Platform announcements and course updates.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{updates?.map((notice) => (
					<div
						key={notice.id}
						className="group flex flex-col gap-2 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
					>
						<div className="flex items-center justify-between">
							<Badge
								variant="secondary"
								className="text-[10px] font-bold uppercase tracking-wider h-5"
							>
								New
							</Badge>
							<span className="text-[10px] text-muted-foreground font-mono">
								{new Date(notice.date).toLocaleDateString()}
							</span>
						</div>
						<h3 className="font-bold text-sm group-hover:text-primary transition-colors">
							{notice.title}
						</h3>
						<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
							{notice.description}
						</p>
					</div>
				))}
				{updates?.length === 0 && (
					<div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/10">
						<p>No new updates for you.</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
