"use client"

import getAdminCourseSingle from "@/api/admin.course.single.api"
import getCourseCategory from "@/api/course.category.api"
import { Button } from "@/components/ui/button"
import { useApiHandler } from "@/hooks/useApiHandler"
import { CourseCategoryType } from "@/types/course.category.type"
import { CourseType } from "@/types/course.type"
import { ArrowLeft, ArrowRight } from "lucide-react"
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
    const [courseData, setCourseData] = useState<CourseType | null>(null)
    const [notFound, setNotFound] = useState(false)
    const [categories, setCategories] = useState<CourseCategoryType[]>([])

    const { isLoading, callApi } = useApiHandler()

    const { _id } = useParams()

    useEffect(() => {
        const handler = async () => {
            if (!_id) {
                toast.error("Course ID is missing")
                return
            }

            const courseSingleData = await callApi(() => getAdminCourseSingle(`${_id}`))
            if (!courseSingleData) {
                setNotFound(true)
                return
            }
            setCourseData(courseSingleData)

            const categoryData = await callApi(getCourseCategory)
            setCategories(categoryData)
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
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                </Button>
                <Button
                    onClick={nextStep}
                    disabled={currentStep === steps.length - 1 || isLoading}
                    className="w-32"
                >
                    {currentStep === steps.length - 1 ? "Finish" : "Next"}
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
