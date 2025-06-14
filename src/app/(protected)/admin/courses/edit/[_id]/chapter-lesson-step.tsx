"use client"

import updateCourseChapterLessons from "@/api/update.course.chapterlessons.api"
import LoadingButton from "@/components/loading-button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useApiHandler } from "@/hooks/useApiHandler"
import { ChapterType, CourseType } from "@/types/course.type"
import { Plus, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ChapterLessonStepProps {
    courseData: CourseType
    setCourseData: React.Dispatch<React.SetStateAction<CourseType | null>>
}

export default function ChapterLessonStep({ courseData, setCourseData }: ChapterLessonStepProps) {
    const [chapters, setChapters] = useState<ChapterType[]>(courseData.chapters || [])
    const { isLoading, callApi } = useApiHandler()

    const addChapter = () => {
        setChapters((prev) => [
            ...prev,
            { title: "", totallessons: 0, preview: false, lessons: [{ title: "", duration: "", type: "video", content: "" }] },
        ])
    }

    const removeChapter = (chapterIndex: number) => {
        setChapters((prev) => prev.filter((_, i) => i !== chapterIndex))
    }

    const updateChapter = (chapterIndex: number, field: string, value: any) => {
        setChapters((prev) => prev.map((chapter, i) => (i === chapterIndex ? { ...chapter, [field]: value } : chapter)))
    }

    const addLesson = (chapterIndex: number) => {
        setChapters((prev) =>
            prev.map((chapter, i) =>
                i === chapterIndex
                    ? { ...chapter, totallessons: chapter.totallessons + 1, lessons: [...chapter.lessons, { title: "", duration: "", type: "video", content: "" }] }
                    : chapter,
            ),
        )
    }

    const removeLesson = (chapterIndex: number, lessonIndex: number) => {
        setChapters((prev) =>
            prev.map((chapter, i) =>
                i === chapterIndex ? { ...chapter, totallessons: chapter.totallessons - 1, lessons: chapter.lessons.filter((_, j) => j !== lessonIndex) } : chapter,
            ),
        )
    }

    const updateLesson = (chapterIndex: number, lessonIndex: number, field: string, value: any) => {
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
        const updatedCourseData = await callApi(() => updateCourseChapterLessons({ chapters }, courseData._id), () => {
            toast.success("Course chapters & lessons updated successfully")
        }
        )
        if (updatedCourseData) {
            setCourseData(updatedCourseData)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chapters & Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Accordion type="multiple" className="space-y-4">
                    {chapters.map((chapter, chapterIndex) => (
                        <AccordionItem key={chapterIndex} value={`chapter-${chapterIndex}`} className="border last:border-b rounded-lg">
                            <AccordionTrigger className="px-4">
                                <div className="flex items-center justify-between w-full mr-4">
                                    <span>
                                        Chapter {chapterIndex + 1}: {chapter.title || "Untitled Chapter"}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Chapter Title</Label>
                                            <Input
                                                value={chapter.title}
                                                onChange={(e) => updateChapter(chapterIndex, "title", e.target.value)}
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
                                            onCheckedChange={(checked) => updateChapter(chapterIndex, "preview", checked)}
                                        />
                                        <Label>Preview Chapter</Label>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">Lessons</h4>
                                            <Button type="button" variant="outline" size="sm" onClick={() => addLesson(chapterIndex)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Lesson
                                            </Button>
                                        </div>

                                        {chapter.lessons.map((lesson, lessonIndex) => (
                                            <Card key={lessonIndex} className="p-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="font-medium">Lesson {lessonIndex + 1}</h5>
                                                        {chapter.lessons.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => removeLesson(chapterIndex, lessonIndex)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Lesson Title</Label>
                                                            <Input
                                                                value={lesson.title}
                                                                onChange={(e) => updateLesson(chapterIndex, lessonIndex, "title", e.target.value)}
                                                                placeholder="Enter lesson title"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Duration</Label>
                                                            <Input
                                                                value={lesson.duration}
                                                                onChange={(e) => updateLesson(chapterIndex, lessonIndex, "duration", e.target.value)}
                                                                placeholder="e.g., 15 min"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Type</Label>
                                                            <Select
                                                                value={lesson.type}
                                                                onValueChange={(value) => updateLesson(chapterIndex, lessonIndex, "type", value)}
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
                                                        // lesson.type === "video" && (
                                                        // <FileUpload
                                                        //     label="Video File"
                                                        //     value={lesson.videoUrl || ""}
                                                        //     onChange={(url) => updateLesson(chapterIndex, lessonIndex, "videoUrl", url)}
                                                        //     accept="video/*"
                                                        // />
                                                        // )
                                                    }

                                                    <div className="space-y-2">
                                                        <Label>Content</Label>
                                                        <Textarea
                                                            value={lesson.content}
                                                            onChange={(e) => updateLesson(chapterIndex, lessonIndex, "content", e.target.value)}
                                                            placeholder="Enter lesson content or description"
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>

                                    {chapters.length > 1 && (
                                        <Button type="button" variant="destructive" size="sm" onClick={() => removeChapter(chapterIndex)}>
                                            <X className="h-4 w-4 mr-2" />
                                            Remove Chapter
                                        </Button>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                <Button type="button" variant="outline" onClick={addChapter} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Chapter
                </Button>

                <div className="flex justify-end">
                    <LoadingButton isLoading={isLoading} title="Saving Changes...">
                        <Button onClick={handleSaveAndContinue}>Save Changes</Button>
                    </LoadingButton>
                </div>
            </CardContent>
        </Card>
    )
}
