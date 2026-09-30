"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useChapterQuery,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
} from "@/query-hooks/chapters.api";
import { useLessonsQuery, useDeleteLessonMutation } from "@/query-hooks/lessons.api";
import { useManageCourseQuery } from "@/query-hooks/courses.api";
import type { Lesson } from "@/schema/lessons.types";
import { useSetBreadcrumbs } from "@/hooks/use-breadcrumb";
import { useCrudDialogState } from "@/hooks/use-crud-dialog-state";
import { formatDuration, formatDate } from "@/lib/utils/format";
import { getLessonColumns } from "@/components/lessons/lesson-columns";
import { DataTable } from "@/components/table/data-table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/common/icon";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/common/loading-button";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";
import { LessonWizardDialog } from "@/app/tutor/courses/[courseId]/chapters/[chapterId]/lessons/lesson-wizard-dialog";
import { cn } from "@/lib/utils/utils";

interface ChapterLessonsViewProps {
  courseId: string;
  chapterId: string;
  role: "admin" | "tutor";
  initialTab?: "lessons" | "settings";
}

export function ChapterLessonsView({
  courseId,
  chapterId,
  role,
  initialTab = "lessons",
}: ChapterLessonsViewProps) {
  const router = useRouter();
  const isTutor = role === "tutor";
  const [activeTab, setActiveTab] = React.useState<"lessons" | "settings">(initialTab);

  const { data: chapter, isLoading: isChapterLoading } = useChapterQuery(chapterId, role);
  const { data: rawLessons, isLoading: isLessonsLoading } = useLessonsQuery(chapterId, role);
  const lessons = rawLessons ?? [];

  const updateChapterMutation = useUpdateChapterMutation(courseId);
  const deleteChapterMutation = useDeleteChapterMutation(courseId);
  const deleteLessonMutation = useDeleteLessonMutation(chapterId);

  const {
    dialogOpen,
    setDialogOpen,
    editing,
    openCreate,
    openEdit,
    deleting,
    setDeleting,
    requestDelete,
    confirmDelete,
  } = useCrudDialogState<Lesson>();

  const [deleteChapterDialogOpen, setDeleteChapterDialogOpen] = React.useState(false);

  // Chapter edit form state
  const [title, setTitle] = React.useState("");

  React.useEffect(() => {
    if (chapter) {
      setTitle(chapter.title || "");
    }
  }, [chapter]);

  const { data: rawCourse } = useManageCourseQuery(courseId, role);
  const courseTitle = rawCourse?.title || "Course";
  const chapterTitle = chapter?.title ? chapter.title : "Chapter";

  useSetBreadcrumbs([
    { label: isTutor ? "My Courses" : "Courses", href: `/${role}/courses` },
    { label: courseTitle, href: `/${role}/courses/${courseId}` },
    { label: "Chapters", href: `/${role}/courses/${courseId}/chapters` },
    {
      label: chapterTitle,
      href: `/${role}/courses/${courseId}/chapters/${chapterId}`,
    },
    { label: activeTab === "lessons" ? "Lessons" : "Settings" },
  ]);

  const columns = React.useMemo(
    () =>
      getLessonColumns(courseId, chapterId, {
        role,
        onEdit: isTutor ? openEdit : undefined,
        onDelete: isTutor ? requestDelete : undefined,
      }),
    [courseId, chapterId, role, isTutor, openEdit, requestDelete],
  );

  const handleUpdateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await updateChapterMutation.execute({
        id: chapterId,
        data: {
          title: title.trim(),
        },
      });
      toast.success("Chapter settings updated successfully");
    } catch {
      // handled in mutation
    }
  };

  const handleDeleteChapter = async () => {
    try {
      await deleteChapterMutation.execute(chapterId);
      toast.success("Chapter deleted successfully");
      router.push(`/${role}/courses/${courseId}/chapters`);
    } catch {
      // handled in mutation
    } finally {
      setDeleteChapterDialogOpen(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Chapter Metadata Card */}
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                Chapter {chapter?.chapter_no ?? "—"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {chapter?.total_lectures ?? 0} lessons •{" "}
                {formatDuration(chapter?.total_duration_seconds ?? 0)}
              </span>
            </div>
            <CardTitle className="text-xl font-bold">
              {chapter?.title ?? (isChapterLoading ? "Loading chapter..." : "Chapter Details")}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild className="h-8">
              <Link href={`/${role}/courses/${courseId}/chapters`}>
                <Icon name="arrow-left" className="mr-1.5 size-3.5" />
                All Chapters
              </Link>
            </Button>
            {isTutor && activeTab === "lessons" && (
              <Button size="sm" className="h-8" onClick={openCreate}>
                <Icon name="plus" className="mr-1.5 size-3.5" />
                Create Lesson
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground font-medium">Chapter Number</span>
              <p className="font-semibold text-foreground">Chapter #{chapter?.chapter_no ?? "—"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground font-medium">Total Lessons</span>
              <p className="font-semibold text-foreground">{chapter?.total_lectures ?? 0} lessons</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground font-medium">Total Duration</span>
              <p className="font-semibold text-foreground">
                {formatDuration(chapter?.total_duration_seconds ?? 0)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground font-medium">Created</span>
              <p className="font-semibold text-foreground">{chapter ? formatDate(chapter.created_at) : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter Tabs: Lessons & Settings */}
      <div className="w-full">
        <nav
          className="inline-flex w-fit h-auto p-1 bg-muted/60 flex-wrap gap-1 rounded-lg border border-border/40"
          aria-label="Chapter sections"
        >
          <button
            type="button"
            onClick={() => setActiveTab("lessons")}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === "lessons"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
            )}
          >
            <Icon name="book" className="size-4" />
            <span>Lessons</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === "settings"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
            )}
          >
            <Icon name="settings" className="size-4" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Lessons */}
      {activeTab === "lessons" && (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={lessons}
            searchPlaceholder="Search lessons..."
            emptyIcon="book"
            emptyText="No lessons found for this chapter"
            isLoading={isLessonsLoading}
            loadingText="Loading lessons..."
          />
        </div>
      )}

      {/* Tab 2: Settings */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chapter Settings</CardTitle>
              <CardDescription>Update chapter title and metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateChapter} className="space-y-4 w-full">
                <div className="space-y-1.5">
                  <Label htmlFor="ch-title">Chapter Title</Label>
                  <Input
                    id="ch-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Introduction to Fiber"
                    required
                  />
                </div>

                {isTutor && (
                  <div className="flex justify-end pt-2">
                    <LoadingButton
                      type="submit"
                      loading={updateChapterMutation.isPending}
                    >
                      Save Changes
                    </LoadingButton>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {isTutor && (
            <Card className="border-destructive/40 bg-destructive/5 shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <Icon name="trash" className="size-5" />
                  <CardTitle className="text-destructive text-lg">Danger Zone</CardTitle>
                  <Badge variant="destructive" className="ml-auto text-xs font-semibold">
                    Irreversible
                  </Badge>
                </div>
                <CardDescription className="text-destructive/80 mt-1">
                  Deleting this chapter will permanently remove all lessons and quiz content inside it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-destructive/20 bg-background/50 p-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Delete this Chapter</h4>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      Once deleted, all lessons, videos, documents, quizzes, and resources belonging
                      to this chapter will be permanently purged.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteChapterDialogOpen(true)}
                    className="shrink-0"
                  >
                    <Icon name="trash" className="mr-1.5 size-4" />
                    Delete Chapter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tutor Lesson Dialogs */}
      {isTutor && (
        <>
          <LessonWizardDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editingLesson={editing}
            chapterId={chapterId}
            courseId={courseId}
          />
          <ConfirmDeleteDialog
            open={!!deleting}
            onOpenChange={(open) => !open && setDeleting(null)}
            onConfirm={() => confirmDelete(deleteLessonMutation.execute)}
            loading={deleteLessonMutation.isPending}
            title="Delete Lesson"
            description={`Are you sure you want to delete lesson "${deleting?.title}"? This action cannot be undone.`}
            confirmText="Delete Lesson"
          />
          <ConfirmDeleteDialog
            open={deleteChapterDialogOpen}
            onOpenChange={setDeleteChapterDialogOpen}
            onConfirm={handleDeleteChapter}
            loading={deleteChapterMutation.isPending}
            title="Delete Chapter"
            description={`Are you sure you want to delete chapter "${chapter?.title}"? All associated lessons and quizzes will be deleted.`}
            confirmText="Delete Chapter"
            variant="destructive"
          />
        </>
      )}
    </div>
  );
}
