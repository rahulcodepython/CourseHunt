"use client";

import * as React from "react";
import Link from "next/link";

import { Icon } from "@package/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { useDiscussionsQuery, useDeleteDiscussionMutation } from "@package/query-hooks/discussions.api";
import { DataTable, type DataTableColumn } from "@package/components/data-table";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import { PageHeader } from "@package/components/page-header";
import { LoadingSpinner as Loading } from "@package/components/loading";
import { useParams } from "next/navigation";
import { formatDate } from "@package/lib/format";
import type { Discussion } from "@package/schema/discussions.types";

function DiscussionUserCell({ discussion }: { discussion: Discussion }) {
  const initials = discussion.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        {discussion.user.image ? (
          <AvatarImage src={discussion.user.image} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium">{discussion.user.name}</span>
    </div>
  );
}

export default function LessonDiscussionsPage() {
	const params = useParams();
	const lessonId = params.lesson_id as string;

	const [page, setPage] = React.useState(1);
	const limit = 20;

	const { data: raw, isLoading } = useDiscussionsQuery(lessonId, page, limit);
	const response = raw?.data;
	const discussions = response?.data ?? [];
	const total = response?.total ?? 0;
	const totalPages = Math.max(1, response ? Math.ceil(response.total / response.limit) : 1);

	const [deleting, setDeleting] = React.useState<Discussion | null>(null);
	const deleteMutation = useDeleteDiscussionMutation();

	const handleDelete = async () => {
		if (deleting) {
			await deleteMutation.execute(deleting.id);
			setDeleting(null);
		}
	};

	if (isLoading || !raw?.data) {
		return (
			<div className="space-y-6">
				<div>
					<Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
						<Link href="/courses">
							<span className="flex items-center gap-1.5">
								<Icon name="IconArrowLeft" className="size-4" />
								Back to Courses
							</span>
						</Link>
					</Button>
					<PageHeader
						title="Lesson Discussions"
						subtitle={`Lesson ID: ${lessonId}`}
					/>
				</div>
				<Loading />
			</div>
		);
	}

	const columns: DataTableColumn<Discussion>[] = [
		{
			header: "User",
			render: (discussion) => <DiscussionUserCell discussion={discussion} />,
		},
		{
			header: "Content",
			render: (discussion) => (
				<span className="block max-w-md truncate text-muted-foreground">
					{discussion.content}
				</span>
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
				<span className="text-muted-foreground">{formatDate(discussion.created_at)}</span>
			),
		},
		{
			header: "",
			render: (discussion) => (
				<div className="flex items-center justify-end">
					<Button
						variant="ghost"
						size="icon"
						className="size-8 text-destructive hover:text-destructive"
						onClick={() => setDeleting(discussion)}
						aria-label="Delete discussion"
					>
						<Icon name="IconTrash" className="size-4" />
					</Button>
				</div>
			),
			className: "text-right",
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
					<Link href="/courses">
						<span className="flex items-center gap-1.5">
							<Icon name="IconArrowLeft" className="size-4" />
							Back to Courses
						</span>
					</Link>
				</Button>
				<PageHeader
					title="Lesson Discussions"
					subtitle={`Lesson ID: ${lessonId}`}
				/>
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
						isLoading={false}
						page={page}
						totalPages={totalPages}
						total={total}
						pageSize={limit}
						onPageChange={setPage}
						label="discussions"
						emptyState={
							<div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
								<Icon name="IconMessages" className="size-8 opacity-40" />
								<p className="text-sm">No discussions yet</p>
							</div>
						}
					/>
				</CardContent>
			</Card>

			<ConfirmDeleteDialog
				open={!!deleting}
				onOpenChange={(open) => !open && setDeleting(null)}
				onConfirm={handleDelete}
				title="Delete Discussion"
				description="Are you sure you want to delete this discussion? All replies will also be removed."
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
