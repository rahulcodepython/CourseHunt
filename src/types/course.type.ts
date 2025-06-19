export type MediaUrlType = {
    url: string;
    fileType: string; // Optional for cases where the file type is not needed
}

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
    imageUrl: MediaUrlType;
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
    videoUrl?: MediaUrlType
    content: string
}

export type FAQType = { question: string; answer: string }

export type ResourcesType = {
    title: string
    fileUrl: MediaUrlType
}

interface CourseDetails {
    longDescription: string;
    whatYouWillLearn: string[];
    prerequisites: string[];
    requirements: string[];
}

export interface CourseSingleType extends CourseCardType, CourseDetails {
    chapters: {
        title: string
        preview: boolean
        lessons: {
            title: string
            duration: string
            type: "video" | "reading"
        }[]
        totallessons: number
    }[];
    chaptersCount: number;
    lessonsCount: number;
    previewVideoUrl: MediaUrlType;
    faq: FAQType[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CourseType extends CourseCardType, CourseDetails {
    previewVideoUrl: MediaUrlType;
    chapters: ChapterType[];
    chaptersCount: number;
    lessonsCount: number;
    isPublished: boolean;
    faq: FAQType[];
    resources: ResourcesType[];
    createdAt: Date;
    updatedAt: Date;
}