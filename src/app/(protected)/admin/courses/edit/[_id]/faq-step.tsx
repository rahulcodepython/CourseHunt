"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FAQType } from "@/types/course.type"
import { ChevronLeft, Plus, X } from "lucide-react"
import { useState } from "react"

interface FAQStepProps {
    onNext: () => void
    onPrev: () => void
}

export default function FAQStep({ onNext, onPrev }: FAQStepProps) {
    const [faqs, setFaqs] = useState<FAQType[]>([{ question: "", answer: "" }])

    const addFAQ = () => {
        setFaqs((prev) => [...prev, { question: "", answer: "" }])
    }

    const removeFAQ = (index: number) => {
        setFaqs((prev) => prev.filter((_, i) => i !== index))
    }

    const updateFAQ = (index: number, field: string, value: string) => {
        setFaqs((prev) => prev.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)))
    }

    const handleSaveAndContinue = () => {
        onNext()
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
                                            <X className="h-4 w-4" />
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
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                </Button>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={onPrev}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <Button onClick={handleSaveAndContinue}>Save & Continue</Button>
                </div>
            </CardContent>
        </Card>
    )
}
