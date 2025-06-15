import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Feedback } from "@/types/feedback.type"
import { Calendar, Mail, Star, User } from "lucide-react"
import Link from "next/link"

const feedbacks: Feedback[] = [
    {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        rating: 5,
        message:
            "Excellent platform! The courses are well-structured and the instructors are knowledgeable. I've learned so much and it has helped me advance in my career.",
        date: "2024-01-15",
        course: "Complete Web Development Bootcamp",
    },
    {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        rating: 4,
        message:
            "Great learning experience. The video quality is excellent and the content is up-to-date. Would love to see more advanced courses in React.",
        date: "2024-01-12",
        course: "React & Next.js Masterclass",
    },
    {
        id: 3,
        name: "Mike Chen",
        email: "mike.chen@example.com",
        rating: 5,
        message:
            "Outstanding! The Python course helped me transition into data science. The projects were practical and relevant to real-world scenarios.",
        date: "2024-01-10",
        course: "Python for Data Science",
    },
    {
        id: 4,
        name: "Emily Davis",
        email: "emily.davis@example.com",
        rating: 4,
        message:
            "Very satisfied with the course content. The instructor explains concepts clearly. The only improvement would be more interactive exercises.",
        date: "2024-01-08",
        course: "Complete Web Development Bootcamp",
    },
    {
        id: 5,
        name: "Alex Rodriguez",
        email: "alex.r@example.com",
        rating: 5,
        message:
            "Fantastic platform! The community support is amazing and the courses are worth every penny. Highly recommend to anyone looking to upskill.",
        date: "2024-01-05",
        course: "React & Next.js Masterclass",
    },
    {
        id: 6,
        name: "Lisa Wang",
        email: "lisa.wang@example.com",
        rating: 3,
        message:
            "Good content overall, but some videos could be shorter. The course material is comprehensive but sometimes feels overwhelming.",
        date: "2024-01-03",
        course: "Python for Data Science",
    },
]

export default function FeedbackPage() {
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
                    {feedbacks.map((feedback) => (
                        <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{feedback.name}</span>
                                            </div>
                                            <Badge className={getRatingColor(feedback.rating)}>{feedback.rating}/5</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Mail className="h-4 w-4" />
                                                {feedback.email}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(feedback.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Badge variant="outline">{feedback.course}</Badge>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">{renderStars(feedback.rating)}</div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">{feedback.message}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {feedbacks.length === 0 && (
                    <Card className="text-center py-12">
                        <CardContent>
                            <p className="text-muted-foreground">No feedback available yet.</p>
                            <Link href="/feedback/create">
                                <Button className="mt-4">Be the first to leave feedback</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
