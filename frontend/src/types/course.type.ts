export type MediaUrlType = {
    url: string;
    fileType: string;
}

export type ChapterType = {
    id: number;
    _id: number;
    course_id?: number;
    title: string;
    preview: boolean;
    order_index?: number;
    totallessons: number;
    lessons: LessonType[];
}

export type LessonType = {
    id: number;
    _id: number;
    chapter_id?: number;
    title: string;
    duration: string;
    type: string; // 'video', 'reading'
    videoUrl: MediaUrlType;
    content: string;
    order_index?: number;
}

export type FAQType = { 
    id?: number;
    question: string; 
    answer: string;
}

export type ResourcesType = {
    id?: number;
    title: string;
    fileUrl: MediaUrlType;
}

interface CourseDetails {
    longDescription: string;
    whatYouWillLearn: string[];
    prerequisites: string[];
    requirements: string[];
}

export interface CourseSingleType extends CourseCardType, CourseDetails {
    chapters: ChapterType[];
    chaptersCount: number;
    lessonsCount: number;
    previewVideoUrl: MediaUrlType;
    faq: FAQType[];
    resources: ResourcesType[];
    createdAt: string;
    updatedAt: string;
}

export interface CourseType extends CourseSingleType {
    creatorId: string;
    isPublished: boolean;
    category_id: number;
    totalRevenue: number;
}

export interface CourseCardType {
    id: number;
    _id: number;
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
    totalRevenue?: number;
    createdAt?: string;
}

export interface UserCourseType {
    _id: number;
    title: string;
    totalLessons: number;
    completedLessons: number;
    duration?: string;
    students?: number;
    rating?: number;
    reviews?: number;
    price?: number;
    originalPrice?: number;
    category?: string;
    discount?: string;
    imageUrl?: MediaUrlType | null;
}
