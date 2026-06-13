import { MediaUrlType } from "./course.type";

export type UserRole = "student" | "tutor" | "admin";

export interface UserProfileType {
    _id: string;
    name: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    zip: string;
    email: string;
    role: UserRole;
    avatar: MediaUrlType;
    createdAt: string;
    updatedAt: string;
    purchasedCourses: number;
    completedCourses: number;
}
