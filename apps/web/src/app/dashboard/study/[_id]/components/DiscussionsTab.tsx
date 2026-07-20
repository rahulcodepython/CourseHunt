"use client";

import React, { useState } from "react";
import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Textarea } from "@package/ui/textarea";
import { Icon } from "@package/components/icon";
import { useDiscussionsQuery, useCreateDiscussionMutation, useDiscussionRepliesQuery } from "@package/query-hooks/discussions.api";

interface DiscussionsTabProps {
	lessonId: string;
}

function DiscussionReplies({ parentId }: { parentId: string }) {
	const [page, setPage] = useState(1);
	const { data, isLoading } = useDiscussionRepliesQuery(parentId, page, 10);
	const replies = data?.data?.data ?? [];
	const total = data?.data?.total ?? 0;
	const hasMore = replies.length < total;

	if (isLoading && page === 1) return <div className="text-xs text-muted-foreground pl-10 py-2">Loading replies...</div>;

	return (
		<div className="pl-6 mt-3 space-y-3 border-l-2 border-muted/30 ml-4">
			{replies.map((reply) => (
				<div key={reply.id} className="bg-muted/20 rounded-lg p-3 text-xs space-y-1">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-foreground">{reply.user.name}</span>
						<span className="text-[10px] text-muted-foreground">{new Date(reply.created_at).toLocaleDateString()}</span>
					</div>
					<p className="text-muted-foreground">{reply.content}</p>
				</div>
			))}
			{hasMore && (
				<button
					onClick={() => setPage((p) => p + 1)}
					className="text-[10px] text-primary hover:underline font-semibold block pt-1 bg-transparent border-none cursor-pointer"
				>
					Load more replies
				</button>
			)}
		</div>
	);
}

export function DiscussionsTab({ lessonId }: DiscussionsTabProps) {
	const [discussionsPage, setDiscussionsPage] = useState(1);
	const discussionsQuery = useDiscussionsQuery(lessonId, discussionsPage, 10);
	const createDiscussionMutation = useCreateDiscussionMutation();

	const [newDiscussionContent, setNewDiscussionContent] = useState("");
	const [replyContents, setReplyContents] = useState<Record<string, string>>({});
	const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

	const handlePostDiscussion = async () => {
		if (!newDiscussionContent.trim()) return;
		const res = await createDiscussionMutation.execute({
			content: newDiscussionContent,
			lesson_id: lessonId,
			parent_id: null,
		});
		if (res) {
			setNewDiscussionContent("");
			discussionsQuery.refetch();
		}
	};

	const handlePostReply = async (parentId: string) => {
		const replyText = replyContents[parentId];
		if (!replyText?.trim()) return;
		const res = await createDiscussionMutation.execute({
			content: replyText,
			lesson_id: lessonId,
			parent_id: parentId,
		});
		if (res) {
			setReplyContents((prev) => ({ ...prev, [parentId]: "" }));
			discussionsQuery.refetch();
			setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
		}
	};

	const discussions = discussionsQuery.data?.data?.data ?? [];

	return (
		<div className="space-y-6">
			{/* New Thread Form */}
			<div className="bg-card border rounded-lg p-4 space-y-3 shadow-xs">
				<Label htmlFor="discuss" className="text-xs font-semibold">Ask a Question / Post Update</Label>
				<Textarea
					id="discuss"
					placeholder="What would you like to discuss about this lesson?"
					value={newDiscussionContent}
					onChange={(e) => setNewDiscussionContent(e.target.value)}
					className="min-h-[80px] bg-muted/20 text-xs"
				/>
				<Button size="sm" onClick={handlePostDiscussion} className="text-white bg-primary cursor-pointer">
					Post Thread
				</Button>
			</div>

			{/* Discussions List */}
			<div className="space-y-4">
				{discussions.map((thread) => {
					const hasReplies = thread.reply_count > 0;
					const isExpanded = !!expandedReplies[thread.id];
					return (
						<Card key={thread.id} className="border shadow-xs">
							<CardContent className="p-4 space-y-3">
								<div className="flex items-center justify-between text-xs border-b pb-2">
									<div className="flex items-center gap-2">
										<span className="font-bold text-foreground">{thread.user.name}</span>
										{thread.user.image && (
											<img src={thread.user.image} alt="" className="w-5 h-5 rounded-full" />
										)}
									</div>
									<span className="text-[10px] text-muted-foreground">{new Date(thread.created_at).toLocaleDateString()}</span>
								</div>
								<p className="text-xs text-muted-foreground whitespace-pre-wrap">{thread.content}</p>

								{/* Reply Button and Reply list toggle */}
								<div className="flex gap-4 pt-1 items-center justify-between">
									{hasReplies && (
										<button
											onClick={() => setExpandedReplies((prev) => ({ ...prev, [thread.id]: !prev[thread.id] }))}
											className="text-[10px] text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
										>
											{isExpanded ? "Hide Replies" : `Show Replies (${thread.reply_count})`}
										</button>
									)}
									<span className="text-[10px] text-muted-foreground ml-auto">Thread</span>
								</div>

								{/* Inner Replies component */}
								{isExpanded && <DiscussionReplies parentId={thread.id} />}

								{/* Post Reply inline form */}
								<div className="flex items-center gap-2 pt-2 border-t mt-3">
									<Input
										placeholder="Write a reply..."
										value={replyContents[thread.id] || ""}
										onChange={(e) => setReplyContents((prev) => ({ ...prev, [thread.id]: e.target.value }))}
										className="h-8 bg-muted/20 text-xs flex-1"
									/>
									<Button size="sm" className="h-8 text-white bg-primary text-xs shrink-0 cursor-pointer" onClick={() => handlePostReply(thread.id)}>
										Reply
									</Button>
								</div>
							</CardContent>
						</Card>
					);
				})}

				{discussions.length === 0 && (
					<div className="text-center py-10 text-xs text-muted-foreground">No discussions posted yet for this lesson.</div>
				)}
			</div>
		</div>
	);
}
