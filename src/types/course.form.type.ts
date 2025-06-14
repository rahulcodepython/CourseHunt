import { ImageUrlType, VideoUrlType } from "./course.type";

export interface CourseBasicFormType {
    title: string;
    description: string;
    duration: string;
    price: number;
    originalPrice: number;
    category: string;
    imageUrl: ImageUrlType;
    previewVideoUrl: VideoUrlType;
}

export interface CourseDetailsFormType {
    longDescription: string;
    whatYouWillLearn: string[];
    prerequisites: string[];
    requirements: string[];
}

export interface CourseSettingsFormType {
    isPublished: boolean
}