"use client";

import { Icon } from "@package/components/icon";
import { Badge } from "@package/ui/badge";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Switch } from "@package/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@package/ui/accordion";
import { useState } from "react";

export function ChapterLessonStep({ course, courseId }: { course: any; courseId: string; onNext: () => void }) {
    const [chapters, setChapters] = useState<any[]>(course.chapters || []);

    const addChapter = () => {
        setChapters([...chapters, { title: "", lessons: [] }]);
    };

    const addLesson = (chapterIndex: number) => {
        const next = [...chapters];
        next[chapterIndex].lessons = [...(next[chapterIndex].lessons || []), { title: "", type: "video", content: "" }];
        setChapters(next);
    };

    return (
        <div className="space-y-6">
            <Accordion type="multiple" className="w-full">
                {chapters.map((chapter, ci) => (
                    <AccordionItem key={ci} value={`chapter-${ci}`}>
                        <AccordionTrigger>
                            <div className="flex items-center gap-2 flex-1">
                                <Input
                                    value={chapter.title}
                                    onChange={(e) => {
                                        const next = [...chapters];
                                        next[ci].title = e.target.value;
                                        setChapters(next);
                                    }}
                                    placeholder={`Chapter ${ci + 1} title`}
                                    className="max-w-md"
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                />
                                <Badge variant="secondary">{chapter.lessons?.length || 0} lessons</Badge>
                                <Button variant="ghost" size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setChapters(chapters.filter((_, j) => j !== ci)); }}>
                                    <Icon name="IconTrash" className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pl-4">
                                {chapter.lessons?.map((lesson: any, li: number) => (
                                    <div key={li} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                        <Input
                                            value={lesson.title}
                                            onChange={(e) => {
                                                const next = [...chapters];
                                                next[ci].lessons[li].title = e.target.value;
                                                setChapters(next);
                                            }}
                                            placeholder="Lesson title"
                                            className="flex-1"
                                        />
                                        <select
                                            value={lesson.type}
                                            onChange={(e) => {
                                                const next = [...chapters];
                                                next[ci].lessons[li].type = e.target.value;
                                                setChapters(next);
                                            }}
                                            className="text-sm border rounded px-2 py-1 bg-background"
                                        >
                                            <option value="video">Video</option>
                                            <option value="reading">Reading</option>
                                        </select>
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            const next = [...chapters];
                                            next[ci].lessons = next[ci].lessons.filter((_: any, k: number) => k !== li);
                                            setChapters(next);
                                        }}>
                                            <Icon name="IconX" className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => addLesson(ci)}>
                                    <Icon name="IconPlus" className="mr-1 h-3 w-3" /> Add Lesson
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            <Button variant="outline" onClick={addChapter}>
                <Icon name="IconPlus" className="mr-1 h-3 w-3" /> Add Chapter
            </Button>
        </div>
    );
}
