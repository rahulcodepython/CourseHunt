"use client";

import React, { useState } from "react";
import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { useStudentDiscussionRepliesQuery } from "@package/query-hooks/discussions.api";

export interface DiscussionNode {
	id: string;
	content: string;
	created_at: string;
	reply_count?: number;
	user: { name: string; image?: string | null };
}

export type PostReply = (parentId: string, content: string) => Promise<boolean>;

interface DiscussionThreadProps {
	node: DiscussionNode;
	depth: number;
	onReply: PostReply;
}

/**
 * Renders a single discussion node (a top-level thread OR a reply) plus its
 * own "reply" box and "show replies" toggle. Nested replies are rendered by
 * <DiscussionRepliesList>, which mounts a <DiscussionThread> for each reply -
 * so a reply-to-a-reply gets the exact same UI, recursively, at any depth.
 * Replies are only fetched once the user expands a node (via conditional
 * mount below), not eagerly for every thread on the page.
 */
export function DiscussionThread({ node, depth, onReply }: DiscussionThreadProps) {
	const [showReplies, setShowReplies] = useState(false);
	const [replyText, setReplyText] = useState("");
	const [refreshKey, setRefreshKey] = useState(0);

	const hasReplies = (node.reply_count ?? 0) > 0;

	const handleReply = async () => {
		if (!replyText.trim()) return;
		const ok = await onReply(node.id, replyText);
		if (ok) {
			setReplyText("");
			setShowReplies(true);
			setRefreshKey((k) => k + 1); // remount the replies list so it refetches
		}
	};

	const body = (
		<div className="space-y-3">
			<div className="flex items-center justify-between text-xs border-b pb-2">
				<div className="flex items-center gap-2">
					<span className="font-bold text-foreground">{node.user.name}</span>
					{node.user.image && <img src={node.user.image} alt="" className="w-5 h-5 rounded-full" />}
				</div>
				<span className="text-[10px] text-muted-foreground">{new Date(node.created_at).toLocaleDateString()}</span>
			</div>
			<p className="text-xs text-muted-foreground whitespace-pre-wrap">{node.content}</p>

			<div className="flex gap-4 pt-1 items-center justify-between">
				{hasReplies && (
					<button
						onClick={() => setShowReplies((v) => !v)}
						className="text-[10px] text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
					>
						{showReplies ? "Hide Replies" : `Show Replies (${node.reply_count})`}
					</button>
				)}
				<span className="text-[10px] text-muted-foreground ml-auto">Thread</span>
			</div>

			<div className="flex items-center gap-2 pt-2 border-t mt-3">
				<Input
					placeholder="Write a reply..."
					value={replyText}
					onChange={(e) => setReplyText(e.target.value)}
					className="h-8 bg-muted/20 text-xs flex-1"
				/>
				<Button size="sm" className="h-8 text-white bg-primary text-xs shrink-0 cursor-pointer" onClick={handleReply}>
					Reply
				</Button>
			</div>
		</div>
	);

	return (
		<div className={depth > 0 ? "pl-6 mt-3 border-l-2 border-muted/30 ml-4" : ""}>
			{depth === 0 ? (
				<Card className="border shadow-xs">
					<CardContent className="p-4">{body}</CardContent>
				</Card>
			) : (
				<div className="bg-muted/20 rounded-lg p-3 text-xs">{body}</div>
			)}

			{showReplies && (
				<DiscussionRepliesList key={refreshKey} parentId={node.id} depth={depth + 1} onReply={onReply} />
			)}
		</div>
	);
}

function DiscussionRepliesList({
	parentId,
	depth,
	onReply,
}: {
	parentId: string;
	depth: number;
	onReply: PostReply;
}) {
	const [page, setPage] = useState(1);
	const repliesQuery = useStudentDiscussionRepliesQuery(parentId, page, 10);
	const replies: DiscussionNode[] = repliesQuery.data?.data?.data ?? [];
	const total = repliesQuery.data?.data?.total ?? 0;
	const hasMore = replies.length > 0 && replies.length < total;

	if (repliesQuery.isLoading && page === 1) {
		return <div className="text-xs text-muted-foreground pl-10 py-2">Loading replies...</div>;
	}

	return (
		<div className="mt-3 space-y-3">
			{replies.map((reply) => (
				// Recursive call: each reply is itself a DiscussionThread.
				<DiscussionThread key={reply.id} node={reply} depth={depth} onReply={onReply} />
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
