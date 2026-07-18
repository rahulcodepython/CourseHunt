"use client";

import { Icon } from "@/components/icon";


import LoadingButton from "@/components/loading-button"
import { Button } from "@package/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card"
import { Input } from "@package/ui/input"
import { Label } from "@package/ui/label"
import { Textarea } from "@package/ui/textarea"
import { useUpdateCourseMutation } from "@/hooks/api"
import { CourseType, FAQType } from "@/types/course.type"

import { useState } from "react"
import { toast } from "sonner"

interface FAQStepProps {
    courseData: CourseType
    setCourseData: React.Dispatch<React.SetStateAction<CourseType | null>>
}

export default function FAQStep({ courseData, setCourseData }: FAQStepProps) {
    const [faqs, setFaqs] = useState<FAQType[]>(courseData.faq || [{ question: "", answer: "" }])
    const { isPending, updateCourse } = useUpdateCourseMutation()

    const addFAQ = () => {
        setFaqs((prev) => [...prev, { question: "", answer: "" }])
    }

    const removeFAQ = (index: number) => {
        setFaqs((prev) => prev.filter((_, i) => i !== index))
    }

    const updateFAQ = (index: number, field: string, value: string) => {
        setFaqs((prev) => prev.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)))
    }

    const handleSaveAndContinue = async () => {
        const updatedCourseData = await updateCourse({
            id: courseData._id.toString(),
            data: { faq: faqs },
        })

        if (updatedCourseData) {
            toast.success("Course FAQ saved successfully")
            setCourseData(updatedCourseData)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <Card key={index} className="p-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">FAQ {index + 1}</h4>
                                    {faqs.length > 1 && (
                                        <Button type="button" variant="outline" size="sm" onClick={() => removeFAQ(index)}>
                                            <Icon name="IconX" className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Question</Label>
                                    <Input
                                        value={faq.question}
                                        onChange={(e) => updateFAQ(index, "question", e.target.value)}
                                        placeholder="Enter frequently asked question"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Answer</Label>
                                    <Textarea
                                        value={faq.answer}
                                        onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                                        placeholder="Enter the answer to this question"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Button type="button" variant="outline" onClick={addFAQ} className="w-full">
                    <Icon name="IconPlus" className="h-5 w-5 mr-2" />
                    Add FAQ
                </Button>

                <div className="flex justify-end">
                    <LoadingButton isLoading={isPending} title="Saving Changes...">
                        <Button onClick={handleSaveAndContinue}>Save Changes</Button>
                    </LoadingButton>
                </div>
            </CardContent>
        </Card>
    )
}
