"use client";

import * as React from "react";

import { useInfiniteDiscussionsQuery, useCreateDiscussionMutation } from "@/query-hooks/discussions.api";
import type { Discussion } from "@/schema/discussions.types";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/common/icon";
import { DiscussionItem } from "./discussion-item";

const PAGE_SIZE = 10;

export function DiscussionsTab({
  lessonId,
  canEditAny = false,
  canDeleteAny = false,
  scope = "student",
}: {
  lessonId: string;
  canEditAny?: boolean;
  canDeleteAny?: boolean;
  scope?: "admin" | "tutor" | "student";
}) {
  const [items, setItems] = React.useState<Discussion[]>([]);
  const [content, setContent] = React.useState("");

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteDiscussionsQuery(lessonId, PAGE_SIZE, scope);
  const createDiscussion = useCreateDiscussionMutation(scope);

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  // Reset accumulated state whenever the lesson changes
  React.useEffect(() => {
    setItems([]);
  }, [lessonId]);

  React.useEffect(() => {
    if (data?.pages) {
      setItems(data.pages.flatMap((page) => page.data));
    }
  }, [data]);

  const submit = async () => {
    if (!content.trim()) return;
    const res = await createDiscussion.execute({ content, parent_id: null, lesson_id: lessonId });
    if (res?.success && res.data) {
      setItems((prev) => [res.data!, ...prev]);
      setContent("");
    }
  };

  const handleUpdated = (updated: Discussion) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ask a question or start a discussion..."
          className="min-h-20"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!content.trim() || createDiscussion.isPending}
            onClick={submit}
          >
            <Icon name="send" className="size-3.5" />
            Post
          </Button>
        </div>
      </div>

      {isLoading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading discussions...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center">
          <Icon name="messages" className="size-8 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No discussions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((d) => (
            <DiscussionItem
              key={d.id}
              lessonId={lessonId}
              discussion={d}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              canEditAny={canEditAny}
              canDeleteAny={canDeleteAny}
              scope={scope}
            />
          ))}
        </div>
      )}

      {/* Auto-fetch infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-2 w-full" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-2 text-xs text-muted-foreground">
          Loading more discussions...
        </div>
      )}
    </div>
  );
}
