"use client";

import React from "react";
import { useDiscussionsQuery, useCreateDiscussionMutation } from "@package/query-hooks/discussions.api";
import { NewDiscussionForm } from "./NewDiscussionForm";
import { DiscussionThread } from "./DiscussionThread";

interface DiscussionsTabProps {
	lessonId: string;
}

export function DiscussionsTab({ lessonId }: DiscussionsTabProps) {
	const discussionsQuery = useDiscussionsQuery(lessonId, 1, 10);
	const createDiscussionMutation = useCreateDiscussionMutation();

	// Shared by the top-level form AND every nested DiscussionThread reply
	// box - a reply at any depth posts through this same function.
	const postDiscussion = async (parentId: string | null, content: string) => {
		const res = await createDiscussionMutation.execute({
			content,
			lesson_id: lessonId,
			parent_id: parentId,
		});
		if (res) {
			discussionsQuery.refetch();
			return true;
		}
		return false;
	};

	const discussions = discussionsQuery.data?.data?.data ?? [];

	return (
		<div className="space-y-6">
			<NewDiscussionForm onSubmit={(content) => postDiscussion(null, content)} />

			<div className="space-y-4">
				{discussions.length === 0 ? (
					<div className="text-center py-10 text-xs text-muted-foreground">No discussions posted yet for this lesson.</div>
				) : (
					discussions.map((thread) => (
						<DiscussionThread key={thread.id} node={thread} depth={0} onReply={postDiscussion} />
					))
				)}
			</div>
		</div>
	);
}
