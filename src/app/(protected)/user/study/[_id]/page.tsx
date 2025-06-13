"use client"

import { CardDescription } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ChevronDown, ChevronRight, Download, FileText, Lock, Play, Video } from "lucide-react"
import { useState } from "react"

const courseData = {
    id: 1,
    title: "Complete Web Development Bootcamp",
    instructor: "John Smith",
    progress: 65,
    totalLessons: 156,
    completedLessons: 101,
}

const chapters = [
    {
        id: 1,
        title: "Introduction to Web Development",
        duration: "2h 30m",
        completed: true,
        lessons: [
            { id: 1, title: "Welcome to the Course", duration: "5:30", type: "video", completed: true, hasVideo: true },
            {
                id: 2,
                title: "Setting Up Your Development Environment",
                duration: "15:45",
                type: "video",
                completed: true,
                hasVideo: true,
            },
            {
                id: 3,
                title: "Course Resources and Materials",
                duration: "8:20",
                type: "text",
                completed: true,
                hasVideo: false,
            },
            { id: 4, title: "How the Web Works", duration: "12:15", type: "video", completed: true, hasVideo: true },
        ],
    },
    {
        id: 2,
        title: "HTML Fundamentals",
        duration: "4h 15m",
        completed: true,
        lessons: [
            { id: 5, title: "HTML Basics and Structure", duration: "18:30", type: "video", completed: true, hasVideo: true },
            { id: 6, title: "HTML Elements and Tags", duration: "22:45", type: "video", completed: true, hasVideo: true },
            { id: 7, title: "Forms and Input Elements", duration: "25:20", type: "video", completed: true, hasVideo: true },
            { id: 8, title: "Semantic HTML", duration: "16:40", type: "video", completed: true, hasVideo: true },
            { id: 9, title: "HTML Best Practices", duration: "12:30", type: "text", completed: true, hasVideo: false },
        ],
    },
    {
        id: 3,
        title: "CSS Styling and Layout",
        duration: "6h 45m",
        completed: false,
        lessons: [
            { id: 10, title: "CSS Basics and Selectors", duration: "20:15", type: "video", completed: true, hasVideo: true },
            { id: 11, title: "Box Model and Layout", duration: "28:30", type: "video", completed: true, hasVideo: true },
            { id: 12, title: "Flexbox Layout", duration: "35:45", type: "video", completed: false, hasVideo: true },
            { id: 13, title: "CSS Grid System", duration: "32:20", type: "video", completed: false, hasVideo: true },
            { id: 14, title: "Responsive Design", duration: "25:15", type: "video", completed: false, hasVideo: false },
            { id: 15, title: "CSS Animations", duration: "18:40", type: "video", completed: false, hasVideo: true },
        ],
    },
    {
        id: 4,
        title: "JavaScript Programming",
        duration: "8h 20m",
        completed: false,
        lessons: [
            { id: 16, title: "JavaScript Fundamentals", duration: "30:15", type: "video", completed: false, hasVideo: true },
            { id: 17, title: "Variables and Data Types", duration: "25:30", type: "video", completed: false, hasVideo: true },
            { id: 18, title: "Functions and Scope", duration: "28:45", type: "video", completed: false, hasVideo: true },
            { id: 19, title: "DOM Manipulation", duration: "35:20", type: "video", completed: false, hasVideo: true },
            { id: 20, title: "Event Handling", duration: "22:30", type: "video", completed: false, hasVideo: true },
        ],
    },
]

const studyMaterials = [
    { id: 1, name: "Course Slides - Introduction", type: "PDF", size: "2.5 MB" },
    { id: 2, name: "HTML Cheat Sheet", type: "PDF", size: "1.2 MB" },
    { id: 3, name: "CSS Reference Guide", type: "PDF", size: "3.8 MB" },
    { id: 4, name: "JavaScript Code Examples", type: "ZIP", size: "5.2 MB" },
    { id: 5, name: "Project Starter Files", type: "ZIP", size: "12.5 MB" },
]

export default function StudyPage() {
    const [selectedLesson, setSelectedLesson] = useState(chapters[2].lessons[0])
    const [openChapters, setOpenChapters] = useState<number[]>([1, 2, 3])

    const toggleChapter = (chapterId: number) => {
        setOpenChapters((prev) => (prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]))
    }

    const handleLessonSelect = (lesson: any) => {
        setSelectedLesson(lesson)
    }

    const handleDownload = (materialId: number) => {
        alert(`Downloading material ${materialId}`)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar - Chapters and Lessons */}
            <div className="w-80 border-r bg-muted/30 p-6 overflow-y-auto h-screen fixed">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">{courseData.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4">by {courseData.instructor}</p>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{courseData.progress}%</span>
                        </div>
                        <Progress value={courseData.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {courseData.completedLessons} of {courseData.totalLessons} lessons completed
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {
                        chapters.map((chapter) => (
                            <Collapsible
                                key={chapter.id}
                                open={openChapters.includes(chapter.id)}
                                onOpenChange={() => toggleChapter(chapter.id)}
                            >
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {openChapters.includes(chapter.id) ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        <div>
                                            <div className="font-medium text-sm">{chapter.title}</div>
                                            <div className="text-xs text-muted-foreground">{chapter.duration}</div>
                                        </div>
                                    </div>
                                    {chapter.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="ml-4 mt-2 space-y-1">
                                    {chapter.lessons.map((lesson) => (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleLessonSelect(lesson)}
                                            className={`flex items-center gap-3 w-full p-2 text-left hover:bg-muted rounded-md transition-colors ${selectedLesson.id === lesson.id ? "bg-primary/10 border border-primary/20" : ""
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {lesson.type === "video" ? (
                                                    <Video className="h-3 w-3 text-muted-foreground" />
                                                ) : (
                                                    <FileText className="h-3 w-3 text-muted-foreground" />
                                                )}
                                                {lesson.completed ? (
                                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <div className="h-3 w-3 border border-muted-foreground rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm">{lesson.title}</div>
                                                <div className="text-xs text-muted-foreground">{lesson.duration}</div>
                                            </div>
                                            {!lesson.completed && <Lock className="h-3 w-3 text-muted-foreground" />}
                                        </button>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        ))
                    }
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-6 ml-80 py-8">
                <div className="container mx-auto space-y-6">
                    {/* Lesson Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">{selectedLesson.title}</h1>
                            <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">
                                    {selectedLesson.type === "video" ? "Video Lesson" : "Reading Material"}
                                </Badge>
                                <span className="text-sm text-muted-foreground">Duration: {selectedLesson.duration}</span>
                                {selectedLesson.completed && <Badge className="bg-green-100 text-green-800">Completed</Badge>}
                            </div>
                        </div>
                        <Button variant="outline">Mark as Complete</Button>
                    </div>

                    {/* Video Player */}
                    <Card>
                        <CardContent className="p-0">
                            {selectedLesson.hasVideo ? (
                                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <Play className="h-16 w-16 mx-auto mb-4 opacity-80" />
                                        <p className="text-lg">Video Player</p>
                                        <p className="text-sm opacity-60">Click to play: {selectedLesson.title}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-lg font-medium">No video for this lesson</p>
                                        <p className="text-sm text-muted-foreground">Please refer to the written content below</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>


                    {/* Study Materials */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Study Materials
                            </CardTitle>
                            <CardDescription>Download additional resources to supplement your learning</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                {studyMaterials.map((material) => (
                                    <div
                                        key={material.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{material.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {material.type} • {material.size}
                                                </div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => handleDownload(material.id)}>
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Written Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lesson Content</CardTitle>
                        </CardHeader>
                        <CardContent className="prose max-w-none">
                            <h3>Introduction to {selectedLesson.title}</h3>
                            <p>
                                Welcome to this comprehensive lesson on {selectedLesson.title.toLowerCase()}. In this section, we'll
                                cover the fundamental concepts and practical applications that will help you master this important
                                topic.
                            </p>

                            <h4>What You'll Learn</h4>
                            <ul>
                                <li>Core concepts and terminology</li>
                                <li>Best practices and common patterns</li>
                                <li>Hands-on examples and exercises</li>
                                <li>Real-world applications</li>
                            </ul>

                            <h4>Key Concepts</h4>
                            <p>
                                This lesson builds upon the previous concepts we've covered and introduces new techniques that are
                                essential for modern web development. Make sure you understand the fundamentals before moving on to
                                the next lesson.
                            </p>

                            <h4>Practice Exercise</h4>
                            <p>
                                Try implementing the concepts covered in this lesson by creating a small project. This hands-on
                                practice will help reinforce your understanding and prepare you for more advanced topics.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
