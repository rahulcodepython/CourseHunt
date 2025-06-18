import { getBaseUrl } from "@/action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { FeedbackType } from "@/types/feedback.type"
import { Calendar, Mail, Star, User } from "lucide-react"
import { cookies } from "next/headers"
import Link from "next/link"

export default async function FeedbackPage() {
    const baseurl = await getBaseUrl()

    const cookieStore = await cookies()

    const response = await fetch(`${baseurl}/api/feedback/all`, {
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        },
    })

    const feedbacks: FeedbackType[] = await response.json().then(data => data.feedbacks || [])

    console.log("Feedbacks:", feedbacks)

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
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

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Student Feedback</h1>
                        <p className="text-muted-foreground mt-2">View all feedback and reviews from our students</p>
                    </div>
                    <Link href="/feedback/create">
                        <Button>Add Feedback</Button>
                    </Link>
                </div>

                <div className="grid gap-6">
                    {
                        feedbacks.map((feedback) => (
                            <Card key={feedback._id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-semibold">{feedback.userName}</span>
                                                </div>
                                                <Badge className={getRatingColor(feedback.rating)}>{feedback.rating}/5</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-4 w-4" />
                                                    {feedback.userEmail}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(feedback.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <Badge variant="outline">{feedback.courseName}</Badge>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">{renderStars(feedback.rating)}</div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed">{feedback.message}</p>
                                </CardContent>
                            </Card>
                        ))
                    }
                </div>

                {
                    feedbacks.length === 0 && (
                        <Card className="text-center py-12">
                            <CardContent>
                                <p className="text-muted-foreground">No feedback available yet.</p>
                                <Link href="/feedback/create">
                                    <Button className="mt-4">Be the first to leave feedback</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )
                }
            </div>
        </div>
    )
}
