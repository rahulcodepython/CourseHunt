"use client";

import { Icon } from "@/components/icon";

import Loading from "@/components/loading"
import LoadingButton from "@/components/loading-button"
import { Badge } from "@package/ui/badge"
import { Button } from "@package/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@package/ui/collapsible"
import { Progress } from "@package/ui/progress"
import {
    useCourseStudyQuery,
    useUpdateLastViewedMutation,
    useUpdateLessonReadMutation,
    useLessonDiscussionsQuery,
    useCreateDiscussionMutation,
} from "@/hooks/api"
import { ChapterType, LessonType, ResourcesType } from "@/types/course.type"
import { CourseProgressType, ViewedLessonType } from "@/types/study.type"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@package/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@package/ui/avatar"
import { Textarea } from "@package/ui/textarea"
import Link from "next/link"
import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"

export default function StudyPage() {
    const [chapters, setChapters] = useState<ChapterType[] | null>(null)
    const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null)
    const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null)
    const [viewedLessons, setViewedLessons] = useState<ViewedLessonType[]>([])
    const [title, setTitle] = useState<string>("")
    const [totalLessons, setTotalLessons] = useState<number>(0)
    const [completedLessons, setCompletedLessons] = useState<number>(0)
    const [resources, setResources] = useState<ResourcesType[]>([])

    const params = useParams()
    const courseId = params._id as string
    const studyQuery = useCourseStudyQuery(courseId)

    const isLoading = studyQuery.isLoading

    useEffect(() => {
        const responseData = studyQuery.data

        if (responseData) {
            setChapters(responseData.chapters)
            setTitle(responseData.title)
            setTotalLessons(responseData.totalLessons)
            setCompletedLessons(responseData.completedLessons)
            setResources(responseData.resources)
            setViewedLessons(responseData.viewedLessons)

            if (!responseData.lastViewedLessonId) {
                setSelectedChapterId(responseData.chapters[0]?._id || null)
                setSelectedLesson(responseData.chapters[0]?.lessons[0] || null)
            } else if (responseData.chapters.length > 0 && responseData.chapters[0].lessons.length > 0) {
                const hasInitialLesson = responseData.chapters.some((chapter: ChapterType) =>
                    chapter.lessons.some((lesson: LessonType) => {
                        if (lesson._id === responseData.lastViewedLessonId) {
                            setSelectedChapterId(chapter._id || null)
                            setSelectedLesson(lesson)
                            return true
                        }

                        return false
                    }),
                )

                if (!hasInitialLesson) {
                    const firstChapter = responseData.chapters[0]
                    const firstLesson = firstChapter.lessons[0]
                    setSelectedChapterId(firstChapter._id ?? null)
                    setSelectedLesson(firstLesson)
                }
            }
        }
    }, [studyQuery.data])

    const handleLessonMarkAsRead = async (lessonId: number, chapterId: number) => {
        if (!selectedLesson) return
        setViewedLessons(prev => [...prev, {
            chapterId: chapterId,
            lessonId: lessonId,
            viewedAt: new Date().toISOString()
        }])
        setCompletedLessons(prev => prev + 1)
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
                            <span>{totalLessons > 0 ? ((completedLessons / totalLessons) * 100).toFixed(0) : 0}%</span>
                        </div>
                        <Progress value={totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0} className="h-2" />
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
                                courseId={courseId}
                                setSelectedChapterId={setSelectedChapterId}
                                viewedLessons={viewedLessons}
                            />
                        ))
                    }
                </div>
            </div>

            {/* Main Content Area */}
            {
                selectedLesson && selectedChapterId && <SelectedLessonContent
                    selectedLesson={selectedLesson}
                    resources={resources}
                    viewedLessons={viewedLessons}
                    handleLessonMarkAsRead={handleLessonMarkAsRead}
                    courseId={courseId}
                    selectedChapterId={selectedChapterId}
                />
            }
        </div>
    )
}

const Chapters = ({ chapter, setSelectedLesson, selectedLesson, courseId, setSelectedChapterId, viewedLessons }: {
    chapter: ChapterType;
    setSelectedLesson: React.Dispatch<React.SetStateAction<LessonType | null>>;
    selectedLesson: LessonType | null;
    courseId: string;
    setSelectedChapterId: React.Dispatch<React.SetStateAction<number | null>>;
    viewedLessons: ViewedLessonType[];
}) => {
    const [openChapters, setOpenChapters] = useState<number[]>([])

    const toggleChapter = (chapterId: number) => {
        setOpenChapters(prev => {
            if (prev.includes(chapterId)) {
                return prev.filter(id => id !== chapterId)
            } else {
                return [...prev, chapterId]
            }
        })
    }
    return <Collapsible
        key={chapter._id}
        open={openChapters.includes(chapter._id)}
        onOpenChange={() => toggleChapter(chapter._id)}
    >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-muted rounded-lg">
            <div className="flex items-center gap-3">
                {
                    openChapters.includes(chapter._id) ? <Icon name="IconChevronDown" className="h-5 w-5" />
                        : <Icon name="IconChevronRight" className="h-5 w-5" />
                }
                <div>
                    <div className="font-medium text-sm">{chapter.title}</div>
                </div>
            </div>
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
                        chapterId={chapter._id}
                        viewedLessons={viewedLessons}
                    />
                ))
            }
        </CollapsibleContent>
    </Collapsible>
}

const Lessons = ({ lesson, setSelectedLesson, selectedLesson, courseId, setSelectedChapterId, chapterId, viewedLessons }: {
    lesson: LessonType;
    setSelectedLesson: React.Dispatch<React.SetStateAction<LessonType | null>>;
    selectedLesson: LessonType | null;
    courseId: string;
    setSelectedChapterId: React.Dispatch<React.SetStateAction<number | null>>;
    chapterId: number;
    viewedLessons: ViewedLessonType[];
}) => {
    const { updateLastViewed } = useUpdateLastViewedMutation()

    const handleLessonSelect = async (lesson: LessonType) => {
        if (!lesson._id) return

        const response = await updateLastViewed({
            lessonId: lesson._id,
            courseId: parseInt(courseId),
        })

        if (response) {
            setSelectedLesson(lesson)
            setSelectedChapterId(chapterId)
        }
    }

    const isLessonViewed = viewedLessons.some(viewed => viewed.lessonId === lesson._id)

    return <button
        key={lesson._id}
        onClick={() => handleLessonSelect(lesson)}
        className={`flex items-center gap-3 w-full p-2 text-left hover:bg-muted rounded-md transition-colors ${selectedLesson?._id === lesson._id ? "bg-primary/10 border border-primary/20" : ""
            }`}
    >
        <div className="flex items-center gap-2">
            {
                lesson.type === "video" ? <Icon name="IconVideo" className="h-3 w-3 text-muted-foreground" />
                    : <Icon name="IconFileText" className="h-3 w-3 text-muted-foreground" />
            }
            {
                isLessonViewed ? <Icon name="IconCircleCheck" className="h-3 w-3 text-green-600" />
                    : <div className="h-3 w-3 border border-muted-foreground rounded-full" />

            }
        </div>
        <div className="flex-1">
            <div className="text-sm">{lesson.title}</div>
            <div className="text-xs text-muted-foreground">{lesson.duration}</div>
        </div>
        {!isLessonViewed && <Icon name="IconLock" className="h-3 w-3 text-muted-foreground" />}
    </button>
}

const MarkAsReadButton = ({ courseId, chapterId, lessonId, handleLessonMarkAsRead }: {
    courseId: string;
    chapterId: number;
    lessonId: number;
    handleLessonMarkAsRead: (lessonId: number, chapterId: number) => Promise<void>;
}) => {
    const { isPending, updateLessonRead } = useUpdateLessonReadMutation()

    const handleMarkAsRead = async () => {
        const responseData = await updateLessonRead({
            courseId: parseInt(courseId),
            chapterId,
            lessonId,
        })

        if (responseData) {
            await handleLessonMarkAsRead(lessonId, chapterId)
            toast.success(responseData.message || "Lesson marked as read")
        }
    }

    return (
        <LoadingButton isLoading={isPending}>
            <Button variant="outline" size="sm" onClick={handleMarkAsRead}>
                Mark as Read
            </Button>
        </LoadingButton>
    )
}

const SelectedLessonContent = ({
    selectedLesson,
    resources,
    viewedLessons,
    handleLessonMarkAsRead,
    courseId,
    selectedChapterId
}: {
    selectedLesson: LessonType | null
    resources: ResourcesType[] | null;
    viewedLessons: ViewedLessonType[] | null;
    handleLessonMarkAsRead: (lessonId: number, chapterId: number) => Promise<void>;
    courseId: string;
    selectedChapterId: number;
}) => {
    if (!selectedLesson) return <></>

    const handleDownload = (materialId: number) => {
        alert(`Downloading material ${materialId}`)
    }

    const isCompleted = viewedLessons?.some(viewed => viewed.lessonId === selectedLesson._id)

    return <div className="p-6 ml-80 py-8">
        <div className="container mx-auto space-y-6">
            {/* Lesson Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{selectedLesson.title}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">
                            {selectedLesson.type === "video" ? "IconVideo Lesson" : "Reading Material"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Duration: {selectedLesson.duration}</span>
                        {isCompleted && <Badge className="bg-green-100 text-green-800">Completed</Badge>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={'/dashboard'}>
                        <Button variant="outline">Return to Dashboard</Button>
                    </Link>
                    {
                        !isCompleted && <MarkAsReadButton
                            courseId={courseId}
                            chapterId={selectedChapterId}
                            lessonId={selectedLesson._id}
                            handleLessonMarkAsRead={handleLessonMarkAsRead}
                        />
                    }
                </div>
            </div>

            <Tabs defaultValue="lesson" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="lesson">Lesson Content</TabsTrigger>
                    <TabsTrigger value="discussions">Discussions</TabsTrigger>
                </TabsList>

                <TabsContent value="lesson" className="space-y-6">
                    {/* IconVideo Player */}
            <Card>
                <CardContent className="p-0">
                    {
                        selectedLesson.type === 'video' ? (
                            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Icon name="IconPlayerPlay" className="h-16 w-16 mx-auto mb-4 opacity-80" />
                                    <p className="text-lg">IconVideo Player</p>
                                    <p className="text-sm opacity-60">Click to play: {selectedLesson.title}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <Icon name="IconFileText" className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
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
                        <Icon name="IconDownload" className="h-5 w-5" />
                        Study Materials
                    </CardTitle>
                    <CardDescription>IconDownload additional resources to supplement your learning</CardDescription>
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
                                            <Icon name="IconFileText" className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{resource.title}</div>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleDownload(index)}>
                                        <Icon name="IconDownload" className="h-5 w-5 mr-1" />
                                        IconDownload
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
            </TabsContent>
            <TabsContent value="discussions">
                <DiscussionsTab lessonId={selectedLesson._id} courseId={parseInt(courseId)} />
            </TabsContent>
            </Tabs>
        </div>
    </div>
}

const DiscussionsTab = ({ lessonId, courseId }: { lessonId: number, courseId: number }) => {
    const { data: discussions = [], isLoading } = useLessonDiscussionsQuery(lessonId);
    const createDiscussion = useCreateDiscussionMutation();
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!message.trim()) return;
        createDiscussion.mutate({ lessonId, message, courseId }, {
            onSuccess: () => setMessage("")
        });
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading discussions...</div>;

    return (
        <Card className="flex flex-col h-[600px]">
            <CardHeader>
                <CardTitle>Lesson Discussions</CardTitle>
                <CardDescription>Ask questions and discuss with your tutor</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {(discussions || []).map((discussion) => (
                        <div key={discussion.id} className={`flex gap-3 ${discussion.isTutorResponse ? "flex-row-reverse" : "flex-row"}`}>
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className={discussion.isTutorResponse ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}>
                                    {discussion.userName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col ${discussion.isTutorResponse ? "items-end" : "items-start"} max-w-[80%]`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold">{discussion.userName}</span>
                                    {discussion.isTutorResponse && <Badge variant="outline" className="text-[10px] h-4 border-amber-200 bg-amber-50 text-amber-700">Tutor</Badge>}
                                    <span className="text-[10px] text-muted-foreground">{new Date(discussion.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className={`p-3 rounded-lg text-sm ${discussion.isTutorResponse ? "bg-amber-100/50 text-amber-900 rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
                                    {discussion.message}
                                </div>
                            </div>
                        </div>
                    ))}
                    {(discussions || []).length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <p>No discussions yet. Start the conversation!</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-muted/30 border-t">
                    <div className="flex gap-2">
                        <Textarea 
                            placeholder="Type your message..." 
                            className="min-h-[60px] resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <Button 
                            className="h-auto px-4 shrink-0" 
                            onClick={handleSend}
                            disabled={!message.trim() || createDiscussion.isPending}
                        >
                            {createDiscussion.isPending ? "..." : <Icon name="IconSend" className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
