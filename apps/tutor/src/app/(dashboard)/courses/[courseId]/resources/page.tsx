"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { useChaptersQuery } from "@package/query-hooks/chapters.api";
import { useLessonsQuery, useLessonResourcesQuery, useAddResourceMutation, useDeleteResourceMutation } from "@package/query-hooks/lessons.api";
import type { Chapter } from "@package/schema/chapters.types";
import type { Lesson, LessonResource } from "@package/schema/lessons.types";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { toast } from "sonner";

export default function CourseResourcesPage() {
    const params = useParams();
    const courseId = params.courseId as string;

    const { data: chaptersRaw } = useChaptersQuery(courseId);
    const chapters: Chapter[] = chaptersRaw?.data ?? [];

    const [selectedChapter, setSelectedChapter] = useState<string>("");
    const [selectedLesson, setSelectedLesson] = useState<string>("");

    const { data: lessonsRaw } = useLessonsQuery(selectedChapter);
    const lessons: Lesson[] = lessonsRaw?.data ?? [];

    const { data: resourcesRaw, isLoading: resourcesLoading } = useLessonResourcesQuery(selectedLesson);
    const resources: LessonResource[] = resourcesRaw?.data ?? [];

    const addResource = useAddResourceMutation(selectedLesson);
    const deleteResource = useDeleteResourceMutation(selectedLesson);

    const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
    const [newResource, setNewResource] = useState({ title: "", file_url: "", file_type: "" });

    const handleAddResource = async () => {
        if (!newResource.title.trim() || !newResource.file_url.trim()) {
            return toast.error("Title and file URL are required");
        }
        const res = await addResource.execute({
            title: newResource.title,
            file_url: newResource.file_url,
            file_type: newResource.file_type || null,
        });
        if (res) {
            setNewResource({ title: "", file_url: "", file_type: "" });
            setResourceDialogOpen(false);
        }
    };

    const handleDeleteResource = async (id: string) => {
        if (confirm("Delete this resource?")) {
            await deleteResource.execute(id);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Course Resources</h1>
                <p className="text-muted-foreground text-sm">Manage downloadable resources for lessons</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Chapter</Label>
                    <Select value={selectedChapter} onValueChange={(v) => { setSelectedChapter(v || ""); setSelectedLesson(""); }}>
                        <SelectTrigger><SelectValue placeholder="Select chapter" /></SelectTrigger>
                        <SelectContent>
                            {chapters.map((ch) => (
                                <SelectItem key={ch.id} value={ch.id}>{ch.chapter_no}. {ch.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Lesson</Label>
                    <Select value={selectedLesson} onValueChange={(v) => setSelectedLesson(v || "")} disabled={!selectedChapter}>
                        <SelectTrigger><SelectValue placeholder="Select lesson" /></SelectTrigger>
                        <SelectContent>
                            {lessons.map((l) => (
                                <SelectItem key={l.id} value={l.id}>{l.lesson_no}. {l.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedLesson && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Resources</CardTitle>
                        <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Icon name="IconPlus" className="w-4 h-4 mr-1" /> Add Resource
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} placeholder="e.g. Course Notes PDF" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>File URL</Label>
                                        <Input value={newResource.file_url} onChange={(e) => setNewResource({ ...newResource, file_url: e.target.value })} placeholder="https://..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>File Type (optional)</Label>
                                        <Select value={newResource.file_type} onValueChange={(v) => setNewResource({ ...newResource, file_type: v || "" })}>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pdf">PDF</SelectItem>
                                                <SelectItem value="video">Video</SelectItem>
                                                <SelectItem value="document">Document</SelectItem>
                                                <SelectItem value="image">Image</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleAddResource} className="w-full">Add Resource</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {resourcesLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
                        <div className="space-y-2">
                            {resources.map((r) => (
                                <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <Icon name={r.file_type === "pdf" ? "IconFileTypePdf" : "IconFile"} className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium">{r.title}</p>
                                            <p className="text-xs text-muted-foreground">{r.file_type || "unknown"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="sm">
                                                <Icon name="IconDownload" className="w-4 h-4" />
                                            </Button>
                                        </a>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteResource(r.id)}>
                                            <Icon name="IconTrash" className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {resources.length === 0 && (
                                <p className="text-center text-muted-foreground text-sm py-8">No resources for this lesson.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!selectedLesson && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <Icon name="IconPaperclip" className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p>Select a chapter and lesson to manage resources.</p>
                </div>
            )}
        </div>
    );
}
