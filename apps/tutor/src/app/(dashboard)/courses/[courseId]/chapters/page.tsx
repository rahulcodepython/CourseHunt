"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { useChaptersQuery, useCreateChapterMutation, useDeleteChapterMutation, useUpdateChapterMutation } from "@package/query-hooks/chapters.api";
import { useLessonsQuery, useCreateLessonMutation, useDeleteLessonMutation } from "@package/query-hooks/lessons.api";
import type { Chapter } from "@package/schema/chapters.types";
import type { Lesson } from "@package/schema/lessons.types";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@package/lib/utils";

export default function CourseChaptersPage() {
    const params = useParams();
    const courseId = params.courseId as string;

    const { data: chaptersRaw, isLoading: chaptersLoading } = useChaptersQuery(courseId);
    const createChapter = useCreateChapterMutation(courseId);
    const deleteChapter = useDeleteChapterMutation(courseId);
    const updateChapter = useUpdateChapterMutation(courseId);

    const chapters: Chapter[] = chaptersRaw?.data ?? [];

    const [newChapterTitle, setNewChapterTitle] = useState("");
    const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
    const [editChapter, setEditChapter] = useState<Chapter | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const [newLesson, setNewLesson] = useState({ title: "", lesson_type: "video", description: "", duration_seconds: 0 });

    const { data: lessonsRaw } = useLessonsQuery(selectedChapterId || "");
    const createLesson = useCreateLessonMutation(selectedChapterId || "");
    const deleteLesson = useDeleteLessonMutation(selectedChapterId || "");

    const lessons: Lesson[] = lessonsRaw?.data ?? [];

    const handleCreateChapter = async () => {
        if (!newChapterTitle.trim()) return toast.error("Chapter title is required");
        const nextNo = chapters.length + 1;
        const res = await createChapter.execute({ title: newChapterTitle, chapter_no: nextNo });
        if (res) {
            setNewChapterTitle("");
            setChapterDialogOpen(false);
        }
    };

    const handleEditChapter = async () => {
        if (!editChapter || !editTitle.trim()) return;
        await updateChapter.execute({ id: editChapter.id, data: { title: editTitle } });
        setEditChapter(null);
        setEditTitle("");
    };

    const handleDeleteChapter = async (id: string) => {
        if (confirm("Delete this chapter and all its lessons?")) {
            await deleteChapter.execute(id);
        }
    };

    const handleCreateLesson = async () => {
        if (!newLesson.title.trim()) return toast.error("Lesson title is required");
        if (!selectedChapterId) return;
        const nextNo = lessons.length + 1;
        const res = await createLesson.execute({
            title: newLesson.title,
            lesson_no: nextNo,
            lesson_type: newLesson.lesson_type,
            short_description: newLesson.description || null,
            duration_seconds: newLesson.duration_seconds || 0,
        });
        if (res) {
            setNewLesson({ title: "", lesson_type: "video", description: "", duration_seconds: 0 });
            setLessonDialogOpen(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Course Structure</h1>
                    <p className="text-muted-foreground text-sm">Manage chapters and lessons</p>
                </div>
                <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Icon name="IconPlus" className="w-4 h-4 mr-1" />
                            Add Chapter
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>New Chapter</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Chapter Title</Label>
                                <Input value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)} placeholder="e.g. Introduction" />
                            </div>
                            <Button onClick={handleCreateChapter} className="w-full">Create</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {chaptersLoading && <p className="text-muted-foreground">Loading chapters...</p>}

            <div className="space-y-6">
                {chapters.map((chapter) => (
                    <Card key={chapter.id}>
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                    {chapter.chapter_no}
                                </div>
                                <div>
                                    <CardTitle className="text-base">{chapter.title}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{chapter.total_lectures} lessons</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { setEditChapter(chapter); setEditTitle(chapter.title); }}>
                                    <Icon name="IconPencil" className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteChapter(chapter.id)}>
                                    <Icon name="IconTrash" className="w-4 h-4" />
                                </Button>
                                <Dialog open={lessonDialogOpen && selectedChapterId === chapter.id} onOpenChange={(open) => { setLessonDialogOpen(open); if (open) setSelectedChapterId(chapter.id); }}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                            <Icon name="IconPlus" className="w-4 h-4 mr-1" /> Lesson
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>New Lesson</DialogTitle></DialogHeader>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Title</Label>
                                                <Input value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} placeholder="Lesson title" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Type</Label>
                                                <Select value={newLesson.lesson_type} onValueChange={(v) => setNewLesson({ ...newLesson, lesson_type: v || "video" })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="video">Video</SelectItem>
                                                        <SelectItem value="document">Document</SelectItem>
                                                        <SelectItem value="quiz">Quiz</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Duration (seconds)</Label>
                                                <Input type="number" value={newLesson.duration_seconds} onChange={(e) => setNewLesson({ ...newLesson, duration_seconds: Number(e.target.value) })} />
                                            </div>
                                            <Button onClick={handleCreateLesson} className="w-full">Create Lesson</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ChapterLessons chapterId={chapter.id} courseId={courseId} />
                        </CardContent>
                    </Card>
                ))}
                {chapters.length === 0 && !chaptersLoading && (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                        <Icon name="IconHierarchy" className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p>No chapters yet. Create your first chapter to get started.</p>
                    </div>
                )}
            </div>

            <Dialog open={!!editChapter} onOpenChange={(open) => { if (!open) setEditChapter(null); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Chapter</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        </div>
                        <Button onClick={handleEditChapter} className="w-full">Save</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ChapterLessons({ chapterId, courseId }: { chapterId: string; courseId: string }) {
    const { data: lessonsRaw, isLoading } = useLessonsQuery(chapterId);
    const deleteLesson = useDeleteLessonMutation(chapterId);
    const lessons: Lesson[] = lessonsRaw?.data ?? [];

    if (isLoading) return <p className="text-xs text-muted-foreground">Loading lessons...</p>;

    return (
        <div className="space-y-2">
            {lessons.map((lesson, i) => (
                <div key={lesson.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                        <div>
                            <span className="text-sm font-medium">{lesson.title}</span>
                            <span className={cn(
                                "text-xs ml-2 px-1.5 py-0.5 rounded",
                                lesson.lesson_type === "video" ? "bg-blue-500/10 text-blue-500" :
                                lesson.lesson_type === "document" ? "bg-green-500/10 text-green-500" :
                                "bg-amber-500/10 text-amber-500"
                            )}>
                                {lesson.lesson_type}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/courses/${courseId}/lessons/${lesson.id}`}>
                            <Button variant="ghost" size="sm">
                                <Icon name="IconSettings" className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Delete this lesson?")) deleteLesson.execute(lesson.id); }}>
                            <Icon name="IconTrash" className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}
            {lessons.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No lessons in this chapter.</p>
            )}
        </div>
    );
}
