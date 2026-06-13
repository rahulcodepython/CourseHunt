"use client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAdminFeedbackQuery, usePinFeedbackMutation, useDeleteFeedbackMutation } from "@/hooks/api"
import { IconCalendar, IconMail, IconStar, IconUser, IconPin, IconPinFilled, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button"

export default function FeedbackPage() {
    const { data: responseData, isLoading } = useAdminFeedbackQuery()
    const pinMutation = usePinFeedbackMutation()
    const deleteMutation = useDeleteFeedbackMutation()

    const feedbacks = responseData?.feedbacks ?? [];

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <IconStar key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                ))}
            </div>
        )
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 5) return "bg-green-100 text-green-800"
        if (rating >= 4) return "bg-blue-100 text-blue-800"
        if (rating >= 3) return "bg-yellow-100 text-yellow-800"
        return "bg-red-100 text-red-800"
    }

    if (isLoading) return <div className="p-8">Loading feedback...</div>

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Student Feedback</h1>
                        <p className="text-muted-foreground mt-2">View all feedback and reviews from our students</p>
                    </div>
                </div>

                {
                    feedbacks.length === 0 ? (
                        <div className='text-center text-gray-500'>
                            No feedback available yet.
                        </div>
                    ) : <div className="grid gap-6">
                        {
                            feedbacks.map((feedback) => (
                                <Card key={feedback._id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <IconUser className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-semibold">{feedback.userName}</span>
                                                    </div>
                                                    <Badge className={getRatingColor(feedback.rating)}>{feedback.rating}/5</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <IconMail className="h-4 w-4" />
                                                        {feedback.userEmail}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <IconCalendar className="h-4 w-4" />
                                                        {new Date(feedback.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <Badge variant="outline">{feedback.courseName}</Badge>
                                            </div>
                                            <div className="flex flex-col items-end gap-3">
                                                {renderStars(feedback.rating)}
                                                <div className="flex items-center gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className={feedback.isPinned ? "text-primary bg-primary/10" : "text-muted-foreground"}
                                                        onClick={() => pinMutation.mutate({ id: feedback.id, pinned: !feedback.isPinned })}
                                                        disabled={pinMutation.isPending}
                                                    >
                                                        {feedback.isPinned ? <IconPinFilled className="w-4 h-4 mr-1" /> : <IconPin className="w-4 h-4 mr-1" />}
                                                        {feedback.isPinned ? "Unpin" : "IconPin"}
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => deleteMutation.mutate(feedback.id)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <IconTrash className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed">{feedback.message}</p>
                                    </CardContent>
                                </Card>
                            ))
                        }
                    </div>
                }
            </div>
        </div>
    )
}
