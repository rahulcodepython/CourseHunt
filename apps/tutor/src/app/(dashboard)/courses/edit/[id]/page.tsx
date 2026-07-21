"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { useCourseLandingQuery } from "@package/query-hooks/courses.api";
import { useCategoriesQuery } from "@package/query-hooks/categories.api";
import { BasicStep } from "./basic-step";
import { DetailsStep } from "./details-step";
import { ChapterLessonStep } from "./chapter-lesson-step";
import { FaqStep } from "./faq-step";
import { ResourcesStep } from "./resources-step";
import { SettingsStep } from "./settings-step";
import { useParams } from "next/navigation";
import { useState } from "react";
import Loading from "@package/components/loading";

const steps = ["Basic", "Details", "Chapters & Lessons", "FAQ", "Resources", "Settings"];

export default function CourseEditPage() {
    const params = useParams();
    const courseId = params.id as string;
    const { data: raw, isLoading } = useCourseLandingQuery(courseId);
    const { data: categoriesRaw } = useCategoriesQuery();
    const course = raw?.data;
    const categories = categoriesRaw?.data ?? [];
    const [currentStep, setCurrentStep] = useState(0);

    if (isLoading) return <Loading />;
    if (!course) return <div className="text-center py-20 text-muted-foreground">Course not found</div>;

    const stepProps = { course, courseId, categories, onNext: () => setCurrentStep(Math.min(currentStep + 1, steps.length - 1)) };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Edit Course</h1>
                <p className="text-muted-foreground text-sm">{course.title}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {steps.map((s, i) => (
                    <Button
                        key={s}
                        variant={i === currentStep ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentStep(i)}
                    >
                        {i === currentStep && <Icon name="IconChevronRight" className="mr-1 h-3 w-3" />}
                        {s}
                    </Button>
                ))}
            </div>

            <Card>
                <CardContent className="p-6">
                    {currentStep === 0 && <BasicStep {...stepProps} />}
                    {currentStep === 1 && <DetailsStep {...stepProps} />}
                    {currentStep === 2 && <ChapterLessonStep {...stepProps} />}
                    {currentStep === 3 && <FaqStep {...stepProps} />}
                    {currentStep === 4 && <ResourcesStep {...stepProps} />}
                    {currentStep === 5 && <SettingsStep {...stepProps} />}
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(currentStep - 1)}
                >
                    Previous
                </Button>
                <Button
                    disabled={currentStep === steps.length - 1}
                    onClick={() => setCurrentStep(currentStep + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
