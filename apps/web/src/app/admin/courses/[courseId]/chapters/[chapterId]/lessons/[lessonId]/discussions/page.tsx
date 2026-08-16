"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useDiscussionsQuery, useCreateDiscussionMutation, useDeleteDiscussionMutation } from "@/query-hooks/discussions.api";
import type { Discussion } from "@/schema/discussions.types";
import { PageHeader } from "@/components/page-header";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { Icon } from "@/components/icon";
import UserAvatar from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { useDebounce } from "@/hooks/use-debounce";

function formatHandle(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `@${clean || "user"}`;
}

type DeleteTarget = {
  discussionId: string;
  authorName: string;
};

type ReplyTarget = {
  discussionId: string;
  parentHandle: string;
};

const replySchema = z.object({
  replyText: z.string().min(1, "Reply content is required"),
});

type ReplyFormData = z.infer<typeof replySchema>;

function DiscussionItem({
  discussion,
  onOpenReplyModal,
  onOpenDeleteConfirm,
}: {
  discussion: Discussion;
  onOpenReplyModal: (target: ReplyTarget) => void;
  onOpenDeleteConfirm: (target: DeleteTarget) => void;
}) {
  const handle = formatHandle(discussion.user?.name || "user");

  return (
    <div className="py-4 space-y-3">
      <div className="flex gap-3 items-start">
        <UserAvatar
          name={discussion.user?.name}
          image={discussion.user?.image}
          className="size-9 shrink-0 border"
          fallbackClassName="font-bold"
        />

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-foreground hover:underline cursor-pointer">
              {handle}
            </span>
            <span className="text-muted-foreground">
              {formatDate(discussion.created_at)}
            </span>
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed font-sans">
            {discussion.content}
          </p>

          <div className="flex items-center gap-1 pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() =>
                onOpenReplyModal({
                  discussionId: discussion.id,
                  parentHandle: handle,
                })
              }
            >
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() =>
                onOpenDeleteConfirm({
                  discussionId: discussion.id,
                  authorName: discussion.user?.name || "Anonymous",
                })
              }
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReplyDialog({
  target,
  onClose,
  onSubmitReply,
}: {
  target: ReplyTarget | null;
  onClose: () => void;
  onSubmitReply: (text: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      replyText: "",
    },
  });

  React.useEffect(() => {
    if (target) {
      reset({ replyText: "" });
    }
  }, [target, reset]);

  const onSubmit = (data: ReplyFormData) => {
    onSubmitReply(data.replyText);
  };

  return (
    <FormDialog
      open={!!target}
      onOpenChange={(open) => !open && onClose()}
      title="Reply to Comment"
      description={`Replying to ${target?.parentHandle ?? ""}`}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reply-text">Your Reply</Label>
          <Textarea
            id="reply-text"
            placeholder="Write your response..."
            {...register("replyText")}
            rows={4}
            autoFocus
          />
          {errors.replyText && (
            <p className="text-xs text-red-400">{errors.replyText.message}</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Post Reply</Button>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}

import { useCourseLandingQuery } from "@/query-hooks/courses.api";
import { useChaptersQuery } from "@/query-hooks/chapters.api";
import { useLessonsQuery } from "@/query-hooks/lessons.api";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";

export default function LessonDiscussionsPage() {
  const params = useParams<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>();
  const { courseId, chapterId, lessonId } = params;

  const { data: courseData } = useCourseLandingQuery(courseId);
  const { data: chaptersData } = useChaptersQuery(courseId);
  const { data: lessonsData } = useLessonsQuery(chapterId);

  const currentChapter = (chaptersData?.data as any[])?.find((ch: any) => ch.id === chapterId);
  const currentLesson = (lessonsData?.data as any[])?.find((l: any) => l.id === lessonId);

  useSetBreadcrumbs([
    { label: "Courses", href: "/courses" },
    { label: courseData?.data?.title || "Course", href: `/courses/overview/${courseId}` },
    { label: "Chapters", href: `/courses/${courseId}/chapters` },
    { label: currentChapter?.title || "Chapter", href: `/courses/${courseId}/chapters/${chapterId}/lessons` },
    { label: currentLesson?.title || "Lesson" },
    { label: "Discussions" },
  ]);

  const { data: rawDiscussions, isLoading } = useDiscussionsQuery(lessonId);
  const createMutation = useCreateDiscussionMutation();
  const deleteMutation = useDeleteDiscussionMutation();

  const discussions: Discussion[] = (rawDiscussions?.data?.data as any) ?? (Array.isArray(rawDiscussions?.data) ? rawDiscussions.data : []);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [replyTarget, setReplyTarget] = React.useState<ReplyTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null);

  const filteredDiscussions = React.useMemo(() => {
    if (!debouncedSearch.trim()) return discussions;
    const q = debouncedSearch.toLowerCase();
    return discussions.filter(
      (d) =>
        d.content.toLowerCase().includes(q) ||
        d.user.name.toLowerCase().includes(q),
    );
  }, [discussions, debouncedSearch]);

  const handleSendReply = async (text: string) => {
    if (!replyTarget) return;
    await createMutation.execute({
      lesson_id: lessonId,
      parent_id: replyTarget.discussionId,
      content: text,
    });
    setReplyTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.execute(deleteTarget.discussionId);
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons`}>
            <span className="flex items-center gap-1.5">
              <Icon name="arrow-left" className="size-4" />
              Back to Lessons
            </span>
          </Link>
        </Button>
        <PageHeader
          title="Lesson Discussions"
          subtitle="Community Q&A and comments thread"
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Comments ({discussions.length})
          </CardTitle>
          <div className="relative w-full sm:w-60">
            <Icon
              name="search"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search comments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {filteredDiscussions.length > 0 ? (
            <div>
              {filteredDiscussions.map((discussion) => (
                <DiscussionItem
                  key={discussion.id}
                  discussion={discussion}
                  onOpenReplyModal={setReplyTarget}
                  onOpenDeleteConfirm={setDeleteTarget}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Icon name="messages" className="size-10 opacity-30" />
              <p className="text-sm font-medium">{isLoading ? "Loading discussions..." : "No comments found"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ReplyDialog
        target={replyTarget}
        onClose={() => setReplyTarget(null)}
        onSubmitReply={handleSendReply}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
        title="Delete Discussion"
        description={`Are you sure you want to delete this discussion by "${deleteTarget?.authorName}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
