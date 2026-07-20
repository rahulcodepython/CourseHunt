"use client";

import { Icon } from "@package/components/icon";

import FileUpload from "@package/components/file-upload"
import LoadingButton from "@package/components/loading-button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@package/ui/accordion"
import { Button } from "@package/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card"
import { Input } from "@package/ui/input"
import { Label } from "@package/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select"
import { Switch } from "@package/ui/switch"
import { Textarea } from "@package/ui/textarea"
import { useUpdateCourseMutation } from "@package/query-hooks/courses.api"
import type { CourseLandingResponse } from "@package/schema/courses.types"

import { useState } from "react"
import { toast } from "sonner"

type LessonInputType = string | { url: string; fileType: string };

interface LessonFormField {
    id?: number;
    title: string;
    duration: string;
    type: string;
    content: string;
    videoUrl: { url: string; fileType: string };
}

interface ChapterFormField {
    id?: number;
    _id?: number;
    title: string;
    totallessons?: number;
    preview: boolean;
    lessons: LessonFormField[];
}

interface ChapterAccordionItemProps {
    chapter: ChapterFormField;
    index: number;
    onChapterChange: (field: string, value: string | boolean) => void;
    onLessonChange: (lessonIndex: number, field: string, value: LessonInputType) => void;
    onAddLesson: () => void;
    onRemoveChapter: () => void;
    onRemoveLesson: (lessonIndex: number) => void;
    showRemove: boolean;
}

function LessonCard({ lesson, index, onLessonChange, onRemove, showRemove }: {
    lesson: LessonFormField;
    index: number;
    onLessonChange: (field: string, value: LessonInputType) => void;
    onRemove: () => void;
    showRemove: boolean;
}) {
    return (
        <Card className="p-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h5 className="font-medium text-sm text-muted-foreground">Lesson {index + 1}</h5>
                    {showRemove && (
                        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
                            <Icon name="IconX" className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Lesson Title</Label>
                        <Input
                            value={lesson.title}
                            onChange={(e) => onLessonChange("title", e.target.value)}
                            placeholder="Enter lesson title"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                            value={lesson.duration}
                            onChange={(e) => onLessonChange("duration", e.target.value)}
                            placeholder="e.g., 15 min"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={lesson.type}
                            onValueChange={(value) => onLessonChange("type", value || "")}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="reading">Reading</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {
                    lesson.type === "video" && (
                        <FileUpload
                            label="Upload Video"
                            onChange={(field, url, fileType) => onLessonChange("videoUrl", { url, fileType })}
                            field="videoUrl"
                            accept="video"
                            value={lesson.videoUrl}
                        />
                    )
                }

                <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                        value={lesson.content}
                        onChange={(e) => onLessonChange("content", e.target.value)}
                        placeholder="Enter lesson content or description"
                        rows={3}
                    />
                </div>
            </div>
        </Card>
    )
}

function ChapterAccordionItem({
    chapter,
    index,
    onChapterChange,
    onLessonChange,
    onAddLesson,
    onRemoveChapter,
    onRemoveLesson,
    showRemove
}: ChapterAccordionItemProps) {
    return (
        <AccordionItem value={`chapter-${index}`} className="border last:border-b rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/30">
                <div className="flex items-center justify-between w-full mr-4">
                    <span className="font-semibold text-left">
                        Chapter {index + 1}: {chapter.title || "Untitled Chapter"}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-4 border-t bg-muted/10">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Chapter Title</Label>
                            <Input
                                value={chapter.title}
                                onChange={(e) => onChapterChange("title", e.target.value)}
                                placeholder="Enter chapter title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Total Lessons</Label>
                            <Input value={chapter.lessons.length} readOnly className="bg-muted" />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={chapter.preview}
                            onCheckedChange={(checked) => onChapterChange("preview", checked)}
                        />
                        <Label>Preview Chapter</Label>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Lessons</h4>
                            <Button type="button" variant="outline" size="sm" onClick={onAddLesson} className="h-8">
                                <Icon name="IconPlus" className="h-3 w-3 mr-2" />
                                Add Lesson
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {
                                chapter.lessons.map((lesson: LessonFormField, lessonIndex: number) => (
                                    <LessonCard
                                        key={lessonIndex}
                                        lesson={lesson}
                                        index={lessonIndex}
                                        onLessonChange={(field, value) => onLessonChange(lessonIndex, field, value)}
                                        onRemove={() => onRemoveLesson(lessonIndex)}
                                        showRemove={chapter.lessons.length > 1}
                                    />
                                ))
                            }
                        </div>
                    </div>

                    {
                        showRemove && (
                            <div className="pt-4 border-t flex justify-end">
                                <Button type="button" variant="destructive" size="sm" onClick={onRemoveChapter} className="h-8">
                                    <Icon name="IconX" className="h-3 w-3 mr-2" />
                                    Remove Chapter
                                </Button>
                            </div>
                        )
                    }
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}

export default function ChapterLessonStep({ courseData, setCourseData }: {
    courseData: CourseLandingResponse;
    setCourseData: React.Dispatch<React.SetStateAction<CourseLandingResponse | null>>;
}) {
    const [chapters, setChapters] = useState<ChapterFormField[]>(courseData.chapters as unknown as ChapterFormField[] || [])
    const mutation = useUpdateCourseMutation()

    const addChapter = () => {
        setChapters((prev) => [
            ...prev,
            { 
                id: 0, 
                _id: 0, 
                title: "", 
                totallessons: 1, 
                preview: false, 
                lessons: [{ 
                    id: 0, 
                    _id: 0, 
                    title: "", 
                    duration: "", 
                    type: "video", 
                    content: "", 
                    videoUrl: { url: "", fileType: "" } 
                }] 
            },
        ])
    }

    const removeChapter = (chapterIndex: number) => {
        setChapters((prev) => prev.filter((_, i) => i !== chapterIndex))
    }

    const updateChapter = (chapterIndex: number, field: string, value: string | boolean) => {
        setChapters((prev) => prev.map((chapter, i) => (i === chapterIndex ? { ...chapter, [field]: value } : chapter)))
    }

    const addLesson = (chapterIndex: number) => {
        setChapters((prev) =>
            prev.map((chapter, i) =>
                i === chapterIndex
                    ? { 
                        ...chapter, 
                        lessons: [...chapter.lessons, { 
                            id: 0, 
                            title: "", 
                            duration: "", 
                            type: "video", 
                            content: "", 
                            videoUrl: { url: "", fileType: "" } 
                        }] 
                    }
                    : chapter,
            ),
        )
    }

    const removeLesson = (chapterIndex: number, lessonIndex: number) => {
        setChapters((prev) =>
            prev.map((chapter, i) =>
                i === chapterIndex ? { ...chapter, lessons: chapter.lessons.filter((_, j) => j !== lessonIndex) } : chapter,
            ),
        )
    }

    const updateLesson = (chapterIndex: number, lessonIndex: number, field: string, value: LessonInputType) => {
        setChapters((prev) =>
            prev.map((chapter, i) =>
                i === chapterIndex
                    ? {
                        ...chapter,
                        lessons: chapter.lessons.map((lesson, j) => (j === lessonIndex ? { ...lesson, [field]: value } : lesson)),
                    }
                    : chapter,
            ),
        )
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await mutation.execute({
            id: courseData.id,
            data: { chapters } as unknown as Record<string, unknown>,
        })

        if (updatedCourseData?.data) {
            toast.success("Course chapters & lessons saved successfully")
            setCourseData(updatedCourseData.data as unknown as CourseLandingResponse)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chapters & Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Accordion type="multiple" className="space-y-4">
                    {
                        chapters.map((chapter: ChapterFormField, chapterIndex: number) => (
                            <ChapterAccordionItem
                                key={chapterIndex}
                                chapter={chapter}
                                index={chapterIndex}
                                onChapterChange={(field, value) => updateChapter(chapterIndex, field, value)}
                                onLessonChange={(lessonIndex, field, value) => updateLesson(chapterIndex, lessonIndex, field, value)}
                                onAddLesson={() => addLesson(chapterIndex)}
                                onRemoveChapter={() => removeChapter(chapterIndex)}
                                onRemoveLesson={(lessonIndex) => removeLesson(chapterIndex, lessonIndex)}
                                showRemove={chapters.length > 1}
                            />
                        ))
                    }
                </Accordion>

                <Button type="button" variant="outline" onClick={addChapter} className="w-full border-dashed py-6 h-auto hover:bg-primary/5 hover:border-primary">
                    <Icon name="IconPlus" className="h-5 w-5 mr-2" />
                    Add New Chapter
                </Button>

                <div className="flex justify-end pt-4 border-t">
                    <LoadingButton isLoading={mutation.isPending} title="Saving Changes...">
                        <Button onClick={handleSaveAndContinue} className="px-10">Save Changes</Button>
                    </LoadingButton>
                </div>
            </CardContent>
        </Card>
    )
}
