"use client";

import { Icon } from "@package/components/icon";


import { Button } from "@package/ui/button"
import { useCourseLandingQuery } from "@package/query-hooks/courses.api"
import { useCategoriesQuery } from "@package/query-hooks/categories.api"
import type { CourseLandingResponse, ChapterCardResponse } from "@package/schema/courses.types"
import type { Category } from "@package/schema/category.types"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import BasicStep from "./basic-step"
import ChapterLessonStep from "./chapter-lesson-step"
import DetailsStep from "./details-step"
import FAQStep from "./faq-step"
import ResourcesStep from "./resources-step"
import SettingsStep from "./settings-step"

const steps = ["Basic", "Details", "Chapter & Lesson", "FAQ", "Resources", "Settings"]

export default function CourseEditForm() {
    const [currentStep, setCurrentStep] = useState(0)
    const [courseData, setCourseData] = useState<CourseLandingResponse | null>(null)

    const { _id } = useParams()
    const courseQuery = useCourseLandingQuery(_id?.toString() || "")
    const categoryQuery = useCategoriesQuery()
    const categories: Category[] = (categoryQuery.data?.data as unknown as Category[]) ?? []
    const isLoading = courseQuery.isPending || categoryQuery.isPending
    const notFound = courseQuery.isError && !courseData

    useEffect(() => {
        if (!_id) {
            toast.error("Course ID is missing")
        }
    }, [_id])

    useEffect(() => {
        if (courseQuery.data?.data) {
            setCourseData(courseQuery.data.data)
        }
    }, [courseQuery.data])

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
        if (!courseData) {
            return
        }

        switch (currentStep) {
            case 0:
                return <BasicStep
                    categories={categories}
                    courseData={courseData}
                    setCourseData={setCourseData}
                />
            case 1:
                return (
                    <DetailsStep
                        courseData={courseData}
                        setCourseData={setCourseData}
                    />
                )
            case 2:
                return (
                    <ChapterLessonStep
                        courseData={courseData}
                        setCourseData={setCourseData}
                    />
                )
            case 3:
                return (
                    <FAQStep
                        courseData={courseData}
                        setCourseData={setCourseData}
                    />
                )
            case 4:
                return (
                    <ResourcesStep
                        courseData={courseData}
                        setCourseData={setCourseData}
                    />
                )
            case 5:
                return (
                    <SettingsStep
                        courseData={courseData}
                        setCourseData={setCourseData}
                    />
                )
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
                </div> : notFound ? <div className="w-full flex items-center justify-center">
                    Course not found
                </div> : renderStep()
            }

            <div className="w-full flex justify-between mt-4">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="w-32"
                >
                    <Icon name="IconArrowLeft" className="w-5 h-5" />
                    Previous
                </Button>
                <Button
                    onClick={nextStep}
                    disabled={currentStep === steps.length - 1 || isLoading}
                    className="w-32"
                >
                    {currentStep === steps.length - 1 ? "Finish" : "Next"}
                    <Icon name="IconArrowRight" className="w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}
