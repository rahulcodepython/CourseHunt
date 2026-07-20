"use client";

import { Badge } from "@package/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { useUpdateFeedQuery } from "@package/query-hooks/updates.api";
import type { UpdateFeedItem } from "@package/schema/updates.types";
import { useState } from "react";

const columns: DataTableColumn<UpdateFeedItem>[] = [
	{
		header: "Course",
		render: (item) => (
			<span className="font-medium text-sm truncate block max-w-30">
				{item.course?.title || "Update"}
			</span>
		),
	},
	{
		header: "Message",
		render: (item) => (
			<span className="text-xs text-muted-foreground line-clamp-2 block max-w-50">
				{item.message}
			</span>
		),
	},
	{
		header: "Date",
		render: (item) => (
			<span className="text-xs text-muted-foreground whitespace-nowrap">
				{new Date(item.created_at).toLocaleDateString()}
			</span>
		),
	},
	{
		header: "",
		render: (item) =>
			item.is_unseen ? (
				<Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider h-5">
					New
				</Badge>
			) : null,
	},
];

export default function DashboardUpdatesSlot() {
	const [page, setPage] = useState(1);
	const limit = 5;

	const { data: raw, isLoading } = useUpdateFeedQuery({ page, limit });
	const feed = raw?.data;

	const updates = feed?.updates?.data ?? [];
	const total = feed?.updates?.total ?? 0;
	const totalPages = feed?.updates ? Math.ceil(feed.updates.total / feed.updates.limit) : 0;

	return (
		<Card className="h-full shadow-sm">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Recent Updates</CardTitle>
					<Badge variant="outline">Latest</Badge>
				</div>
				<CardDescription>Platform announcements and course updates.</CardDescription>
			</CardHeader>
			<CardContent>
				<DataTable
					columns={columns}
					data={updates}
					keyExtractor={(item) => item.id}
					isLoading={isLoading}
					page={page}
					totalPages={totalPages}
					total={total}
					pageSize={limit}
					onPageChange={setPage}
					label="updates"
					emptyState={
						<div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl bg-muted/10">
							<p>No updates for you.</p>
						</div>
					}
				/>
			</CardContent>
		</Card>
	);
}
