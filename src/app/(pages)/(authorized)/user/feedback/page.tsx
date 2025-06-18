"use client"

import getCourseName from "@/api/course.name.api"
import createFeedback from "@/api/create.feedback.api"
import LoadingButton from "@/components/loading-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useApiHandler } from "@/hooks/useApiHandler"
import { Star } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function CreateFeedbackPage() {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [formData, setFormData] = useState({
        courseId: "",
        message: "",
    })

    const [courses, setCourses] = useState<{ _id: string, title: string }[] | null>(null)

    const { isLoading, callApi } = useApiHandler()

    useEffect(() => {
        const fetchCourse = async () => {
            const courseData = await callApi(getCourseName)

            if (courseData) {
                setCourses(courseData.courses || [])
            }
        }

        fetchCourse()
    }, [])

    const handleSubmit = async () => {
        const responseData = await callApi(() => createFeedback(formData.courseId, formData.message, rating), () => {
            setFormData({ courseId: "", message: "" })
            setRating(0)
        })

        if (responseData) {
            toast.success(responseData.message || "Feedback submitted successfully")
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="bg-background h-full flex items-center justify-center flex-1">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8 justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Share Your Feedback</h1>
                        <p className="text-muted-foreground mt-2">Help us improve by sharing your learning experience</p>
                    </div>
                </div>

                <Card>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="space-y-2">
                                    <Label htmlFor="course">Course *</Label>
                                    <Select onValueChange={(value) => handleInputChange("courseId", value)} value={formData.courseId} required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select the course you want to review" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {
                                                courses && courses.map((course) => (
                                                    <SelectItem key={course._id} value={course._id}>
                                                        {course.title}
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Rating *</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className="p-1 hover:scale-110 transition-transform"
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoveredRating(star)}
                                                    onMouseLeave={() => setHoveredRating(0)}
                                                >
                                                    <Star
                                                        className={`h-6 w-6 ${star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground ml-2">{rating > 0 && `${rating}/5 stars`}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Click on the stars to rate your experience</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Your Feedback *</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Share your thoughts about the course, instructor, content quality, or any suggestions for improvement..."
                                    rows={6}
                                    value={formData.message}
                                    onChange={(e) => handleInputChange("message", e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Minimum 20 characters required</p>
                            </div>

                            <div className="flex gap-4 justify-end">
                                <LoadingButton isLoading={isLoading} title="Submitting...">
                                    <Button
                                        type="submit"
                                        className="cursor-pointer"
                                        disabled={!rating || formData.message.length < 20}
                                        onClick={handleSubmit}
                                    >
                                        Submit Feedback
                                    </Button>
                                </LoadingButton>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
