"use client"

import { Button } from "@/components/ui/button"
import { CourseDetailsType } from "@/types/course.type"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import BasicStep from "./basic-step"

const steps = ["Basic", "Details", "Chapter & Lesson", "FAQ", "Resources", "Settings"]

export default function CourseEditForm() {
    const [currentStep, setCurrentStep] = useState(0)
    const [courseData, setCourseData] = useState<CourseDetailsType | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const { _id } = useParams()

    useEffect(() => {
        const handler = async () => {
            if (!_id) {
                toast.error("Course ID is missing")
                return
            }

            try {
                const response = await fetch(`/api/courses/${_id}`)

                if (!response.ok) {
                    const data = await response.json()
                    toast.error(data.error || "Unknown error")
                    return
                }

                const data = await response.json()
                setCourseData(data.course)
            } catch (error) {
                toast.error("Failed to fetch course data")
            } finally {
                setIsLoading(false)
            }
        }

        handler()
    }, [])

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <BasicStep
                    courseData={courseData}
                    setCourseData={setCourseData}
                />
            // case 1:
            //     return (
            //         <DetailsStep
            //             courseData={courseData}
            //             onNext={nextStep}
            //             onPrev={prevStep}
            //         />
            //     )
            // case 2:
            //     return (
            //         <ChapterLessonStep
            //             courseData={courseData}
            //             onNext={nextStep}
            //             onPrev={prevStep}
            //         />
            //     )
            // case 3:
            //     return (
            //         <FAQStep
            //             courseData={courseData}
            //             onNext={nextStep}
            //             onPrev={prevStep}
            //         />
            //     )
            // case 4:
            //     return (
            //         <ResourcesStep
            //             courseData={courseData}
            //             onNext={nextStep}
            //             onPrev={prevStep}
            //         />
            //     )
            // case 5:
            //     return (
            //         <SettingsStep
            //             courseData={courseData}
            //             onPrev={prevStep}
            //         />
            //     )
            default:
                return null
        }
    }

    return (
        <div className="mx-auto p-6 space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <h1 className="text-3xl font-bold">Edit Course</h1>
                    <span>
                        Step {currentStep + 1} of {steps.length}
                    </span>
                </div>

                {/* Step Navigation */}
                <div className="flex items-center justify-center gap-8 overflow-x-auto pb-2">
                    {steps.map((step, index) => (
                        <Button
                            key={step}
                            variant={index === currentStep ? "default" : index < currentStep ? "secondary" : "outline"}
                            size="sm"
                            className="whitespace-nowrap"
                            onClick={() => setCurrentStep(index)}
                        >
                            {index + 1}. {step}
                        </Button>
                    ))}
                </div>
            </div>

            {
                isLoading ? <div className="w-full flex items-center justify-center">
                    Fetching course data...
                </div> : renderStep()
            }
        </div>
    )
}
