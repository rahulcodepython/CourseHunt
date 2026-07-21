"use client";

import { Icon } from "@package/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { useDiscussionsQuery, useDeleteDiscussionMutation } from "@package/query-hooks/discussions.api";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Discussion } from "@package/schema/discussions.types";

export default function LessonDiscussionsPage() {
	const params = useParams();
	const lessonId = params.lesson_id as string;

	const [page, setPage] = useState(1);
	const limit = 20;

	const { data: raw, isLoading } = useDiscussionsQuery(lessonId, page, limit);
	const response = raw?.data;
	const discussions = response?.data ?? [];
	const total = response?.total ?? 0;
	const totalPages = response ? Math.ceil(response.total / response.limit) : 0;

	const [deleteId, setDeleteId] = useState<string | null>(null);
	const deleteMutation = useDeleteDiscussionMutation();

	const handleDelete = async () => {
		if (deleteId) {
			await deleteMutation.execute(deleteId);
			setDeleteId(null);
		}
	};

	const columns: DataTableColumn<Discussion>[] = [
		{
			header: "User",
			render: (discussion) => (
				<div className="flex items-center gap-3">
					<Avatar className="h-8 w-8">
						<AvatarImage src={discussion.user.image || undefined} />
						<AvatarFallback>{discussion.user.name?.charAt(0) || "U"}</AvatarFallback>
					</Avatar>
					<span className="font-medium text-sm">{discussion.user.name}</span>
				</div>
			),
		},
		{
			header: "Content",
			render: (discussion) => (
				<div className="text-sm text-muted-foreground max-w-md truncate">{discussion.content}</div>
			),
		},
		{
			header: "Replies",
			render: (discussion) => (
				<Badge variant="secondary">{discussion.reply_count}</Badge>
			),
		},
		{
			header: "Date",
			render: (discussion) => (
				<span className="text-sm text-muted-foreground">{new Date(discussion.created_at).toLocaleDateString()}</span>
			),
		},
		{
			header: "",
			render: (discussion) => (
				<div className="flex justify-end">
					<Button
						variant="ghost"
						size="sm"
						className="text-destructive"
						onClick={() => setDeleteId(discussion.id)}
						title="Delete discussion"
					>
						<Icon name="IconTrash" className="w-4 h-4" />
					</Button>
				</div>
			),
			className: "text-right",
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<div className="flex items-center gap-2 mb-2">
					<Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
						<Icon name="IconArrowLeft" className="w-4 h-4" />
						Back to Courses
					</Link>
				</div>
				<h1 className="text-2xl font-bold">Lesson Discussions</h1>
				<p className="text-muted-foreground text-sm">View and manage discussions for lesson {lessonId.slice(0, 8)}...</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Discussions ({total})</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						columns={columns}
						data={discussions}
						keyExtractor={(d) => d.id}
						isLoading={isLoading}
						page={page}
						totalPages={totalPages}
						total={total}
						pageSize={limit}
						onPageChange={setPage}
						label="discussions"
					/>
				</CardContent>
			</Card>

			<ConfirmDeleteDialog
				open={!!deleteId}
				onOpenChange={(open) => !open && setDeleteId(null)}
				onConfirm={handleDelete}
				title="Delete Discussion"
				description="Are you sure you want to delete this discussion? All replies will also be removed."
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
