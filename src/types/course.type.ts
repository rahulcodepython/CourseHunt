export interface CourseCardType {
    _id: string; // Optional for cases where the ID is not needed
    title: string;
    description: string;
    duration: string;
    students: number;
    rating: number;
    reviews: number;
    price: number;
    originalPrice: number;
    category: string;
    discount: string;
    imageUrl: string;
    previewVideoUrl: string;
}

export type ChapterType = {
    title: string
    preview: boolean
    lessons: LessonType[]
    totallessons: number
}

export type LessonType = {
    title: string
    duration: string
    type: "video" | "reading"
    videoUrl?: string
    content: string
}

export type FAQType = { question: string; answer: string }

export type ResourcesType = {
    title: string
    fileUrl: string
}

export interface CourseDetailsType extends CourseCardType {
    videoUrl: string;
    longDescription: string;
    whatYoullLearn: string[];
    prerequisites: string[];
    requirements: string[];
    chapters: ChapterType[];
    chaptersCount: number;
    lessonsCount: number;
    isPublished: boolean;
    faq: FAQType[];
    resources: ResourcesType[];
    createdAt: Date;
    updatedAt: Date;
}