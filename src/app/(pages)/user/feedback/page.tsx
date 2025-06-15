"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Star } from "lucide-react"
import { useState } from "react"

const courses = [
    "Complete Web Development Bootcamp",
    "React & Next.js Masterclass",
    "Python for Data Science",
    "Mobile App Development",
    "UI/UX Design Fundamentals",
    "Digital Marketing Mastery",
]

export default function CreateFeedbackPage() {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        course: "",
        message: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Handle form submission here
        console.log({ ...formData, rating })
        alert("Feedback submitted successfully!")
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="bg-background h-full flex items-center justify-center flex-1">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-8 justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Share Your Feedback</h1>
                            <p className="text-muted-foreground mt-2">Help us improve by sharing your learning experience</p>
                        </div>
                        <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => window.history.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Previous
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Course Feedback Form</CardTitle>
                            <CardDescription>
                                Your feedback helps us improve our courses and helps other students make informed decisions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="Enter your full name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange("name", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="course">Course *</Label>
                                    <Select onValueChange={(value) => handleInputChange("course", value)} required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select the course you want to review" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map((course) => (
                                                <SelectItem key={course} value={course}>
                                                    {course}
                                                </SelectItem>
                                            ))}
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
                                                        className={`h-8 w-8 ${star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground ml-2">{rating > 0 && `${rating}/5 stars`}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Click on the stars to rate your experience</p>
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
                                    <Button type="submit" className="cursor-pointer" disabled={!rating || formData.message.length < 20}>
                                        Submit Feedback
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
