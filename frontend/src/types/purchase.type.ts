import { MediaUrlType } from "./course.type";
import { TransactionType } from "./transaction.type";

export interface CheckoutCourseType {
    _id: number;
    title: string;
    price: number;
    originalPrice: number;
    imageUrl: MediaUrlType;
    category: string;
}

export interface CheckoutUserType {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    zip: string;
}

export interface CheckoutInfoType {
    user: CheckoutUserType;
    course: CheckoutCourseType;
}

export interface PurchaseCourseDataType {
    courseId: number;
    couponId?: number | null;
    price: number;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    country: string;
}

export interface PurchaseResponseType {
    transaction: TransactionType;
}
