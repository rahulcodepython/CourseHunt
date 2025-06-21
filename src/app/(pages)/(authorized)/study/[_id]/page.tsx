"use client"
import getCourseStudyData from "@/api/course.study.api"
import updateLastViewed from "@/api/update.lastViewed.api"
import updateLessonRead from "@/api/update.lesson.read.api"
import Loading from "@/components/loading"
import LoadingButton from "@/components/loading-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { useApiHandler } from "@/hooks/useApiHandler"
import { CheckCircle, ChevronDown, ChevronRight, Download, FileText, Lock, Play, Video } from "lucide-react"
import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"

export interface ResponseType {
    _id: string;
    title: string;
    totalLessons: number;
    completedLessons: number;
    lastViewedLessonId: string;
    chapters: ChapterType[];
    resources: {
        _id: string;
        title: string;
        fileUrl: {
            url: string;
            fileType: string;
        };
    }[];
}

export interface ChapterType {
    _id: string;
    title: string;
    preview: boolean;
    totallessons: number;
    lessons: LessonType[];
}

export interface LessonType {
    _id: string;
    title: string;
    duration: string;
    type: 'video' | 'reading';
    videoUrl: {
        url: string;
        fileType: string;
    };
    content: string;
    isCompleted: boolean;
}


export default function StudyPage() {
    const [chapters, setChapters] = useState<ChapterType[] | null>(null)
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
    const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null)
    const [title, setTitle] = useState<string>("")
    const [totalLessons, setTotalLessons] = useState<number>(0)
    const [completedLessons, setCompletedLessons] = useState<number>(0)
    const [resources, setResources] = useState<ResponseType['resources']>([])

    const params = useParams()

    const { isLoading, callApi } = useApiHandler()

    useEffect(() => {
        const _id = params._id

        const handler = async () => {
            const responseData: ResponseType = await callApi(() => getCourseStudyData(_id as string))

            console.log("Response Data:", responseData)

            if (responseData) {
                setChapters(responseData.chapters)
                setTitle(responseData.title)
                setTotalLessons(responseData.totalLessons)
                setCompletedLessons(responseData.completedLessons)
                setResources(responseData.resources)

                // Set initial selected lesson
                if (responseData.chapters.length > 0 && responseData.chapters[0].lessons.length > 0) {
                    const hasInitialLessons = responseData.chapters.map(chapter => chapter.lessons.find(lesson => {
                        if (lesson._id === responseData.lastViewedLessonId) {
                            setSelectedChapterId(chapter._id)
                            setSelectedLesson(lesson)
                            return true
                        }
                        return false
                    }))

                    if (!hasInitialLessons) {
                        // If no last viewed lesson found, select the first lesson of the first chapter
                        const firstChapter = responseData.chapters[0]
                        const firstLesson = firstChapter.lessons[0]
                        setSelectedChapterId(firstChapter._id)
                        setSelectedLesson(firstLesson)
                    }
                }
            }
        }

        handler()
    }, [])

    const handleLessonMarkAsRead = async (lessonId: string) => {
        // This function is called when the "Mark as Read" button is clicked and it will update the selectedLesson state value isCompleted to true and also update the chapters state also the same
        if (!selectedLesson) return
        const updatedLesson = { ...selectedLesson, isCompleted: true }
        setSelectedLesson(updatedLesson)
        setChapters(prevChapters => {
            return prevChapters?.map(chapter => {
                if (chapter._id === selectedChapterId) {
                    return {
                        ...chapter,
                        lessons: chapter.lessons.map(lesson => {
                            if (lesson._id === lessonId) {
                                return updatedLesson
                            }
                            return lesson
                        })
                    }
                }
                return chapter
            }) || null
        })
    }

    const handleDownload = (materialId: number) => {
        alert(`Downloading material ${materialId}`)
    }

    return (
        isLoading ? <Loading /> : <div className="min-h-screen bg-background">
            {/* Sidebar - Chapters and Lessons */}
            <div className="w-80 border-r bg-muted/30 p-6 overflow-y-auto h-screen fixed">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">{title}</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{(completedLessons / totalLessons) * 100}%</span>
                        </div>
                        <Progress value={(completedLessons / totalLessons) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {completedLessons} of {totalLessons} lessons completed
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {
                        chapters && chapters.map((chapter) => (
                            <Chapters
                                key={chapter._id}
                                chapter={chapter}
                                setSelectedLesson={setSelectedLesson}
                                selectedLesson={selectedLesson}
                                courseId={params._id as string}
                                setSelectedChapterId={setSelectedChapterId}
                            />
                        ))
                    }
                </div>
            </div>

            {/* Main Content Area */}
            {
                selectedLesson && <div className="p-6 ml-80 py-8">
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
                                    {selectedLesson.isCompleted && <Badge className="bg-green-100 text-green-800">Completed</Badge>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline">Return to Dashboard</Button>
                                {
                                    selectedChapterId && <MarkAsReadButton
                                        courseId={params._id as string}
                                        chapterId={selectedChapterId}
                                        lessonId={selectedLesson._id}
                                        handleLessonMarkAsRead={handleLessonMarkAsRead}
                                    />
                                }
                            </div>
                        </div>

                        {/* Video Player */}
                        <Card>
                            <CardContent className="p-0">
                                {
                                    selectedLesson.type === 'video' ? (
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
                                    )
                                }
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
                                    {
                                        resources && resources.map((resource, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded">
                                                        <FileText className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{resource.title}</div>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => handleDownload(index)}>
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                        ))
                                    }
                                </div>
                            </CardContent>
                        </Card>

                        {/* Written Content */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Lesson Content</CardTitle>
                            </CardHeader>
                            <CardContent className="prose max-w-none">
                                {selectedLesson.content}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            }
        </div>
    )
}

const Chapters = ({ chapter, setSelectedLesson, selectedLesson, courseId, setSelectedChapterId }: {
    chapter: ChapterType;
    setSelectedLesson: React.Dispatch<React.SetStateAction<LessonType | null>>;
    selectedLesson: LessonType | null;
    courseId: string;
    setSelectedChapterId: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
    const [openChapters, setOpenChapters] = useState<string[]>([])
    const [isChapterCompleted, setIsChapterCompleted] = useState<boolean>(chapter.lessons.every(lesson => lesson.isCompleted))

    useEffect(() => {
        setIsChapterCompleted(chapter.lessons.every(lesson => lesson.isCompleted))
    }, [chapter.lessons])

    const toggleChapter = (chapterId: string) => {
        setOpenChapters(prev => {
            if (prev.includes(chapterId.toString())) {
                return prev.filter(id => id !== chapterId.toString())
            } else {
                return [...prev, chapterId.toString()]
            }
        })
    }
    return <Collapsible
        key={chapter._id}
        open={openChapters.includes(chapter._id as string)}
        onOpenChange={() => toggleChapter(chapter._id as string)}
    >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-muted rounded-lg">
            <div className="flex items-center gap-3">
                {
                    openChapters.includes(chapter._id) ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />
                }
                <div>
                    <div className="font-medium text-sm">{chapter.title}</div>
                </div>
            </div>
            {
                isChapterCompleted && <CheckCircle className="h-4 w-4 text-green-600" />
            }
        </CollapsibleTrigger>
        <CollapsibleContent className="ml-4 mt-2 space-y-1">
            {
                chapter.lessons.map((lesson) => (
                    <Lessons
                        key={lesson._id}
                        lesson={lesson}
                        setSelectedLesson={setSelectedLesson}
                        selectedLesson={selectedLesson}
                        courseId={courseId}
                        setSelectedChapterId={setSelectedChapterId}
                        chapterId={chapter._id.toString()}
                    />
                ))
            }
        </CollapsibleContent>
    </Collapsible>
}

const Lessons = ({ lesson, setSelectedLesson, selectedLesson, courseId, setSelectedChapterId, chapterId }: {
    lesson: LessonType;
    setSelectedLesson: React.Dispatch<React.SetStateAction<LessonType | null>>;
    selectedLesson: LessonType | null;
    courseId: string;
    setSelectedChapterId: React.Dispatch<React.SetStateAction<string | null>>;
    chapterId: string;
}) => {
    const { callApi } = useApiHandler()

    const handleLessonSelect = async (lesson: LessonType) => {
        await callApi(() => updateLastViewed(lesson._id, courseId), () => {
            setSelectedLesson(lesson)
            setSelectedChapterId(chapterId)
        })
    }

    return <button
        key={lesson._id}
        onClick={() => handleLessonSelect(lesson)}
        className={`flex items-center gap-3 w-full p-2 text-left hover:bg-muted rounded-md transition-colors ${selectedLesson?._id === lesson._id ? "bg-primary/10 border border-primary/20" : ""
            }`}
    >
        <div className="flex items-center gap-2">
            {
                lesson.type === "video" ? <Video className="h-3 w-3 text-muted-foreground" />
                    : <FileText className="h-3 w-3 text-muted-foreground" />
            }
            {
                lesson.isCompleted ? <CheckCircle className="h-3 w-3 text-green-600" />
                    : <div className="h-3 w-3 border border-muted-foreground rounded-full" />

            }
        </div>
        <div className="flex-1">
            <div className="text-sm">{lesson.title}</div>
            <div className="text-xs text-muted-foreground">{lesson.duration}</div>
        </div>
        {!lesson.isCompleted && <Lock className="h-3 w-3 text-muted-foreground" />}
    </button>
}

const MarkAsReadButton = ({ courseId, chapterId, lessonId, handleLessonMarkAsRead }: {
    courseId: string;
    chapterId: string;
    lessonId: string;
    handleLessonMarkAsRead: (lessonId: string) => Promise<void>;
}) => {
    const { isLoading, callApi } = useApiHandler()

    const handleMarkAsRead = async () => {
        const responseData = await callApi(() => updateLessonRead(courseId, chapterId, lessonId))

        if (responseData) {
            await handleLessonMarkAsRead(lessonId)
            toast.success(responseData.message || "Lesson marked as read")
        }
    }

    return (
        <LoadingButton isLoading={isLoading}>
            <Button variant="outline" size="sm" onClick={handleMarkAsRead}>
                Mark as Read
            </Button>
        </LoadingButton>
    )
}