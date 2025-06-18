export interface FeedbackType {
    _id: string
    userId: string;
    userName: string;
    userEmail: string;
    rating: number;
    createdAt: Date;
    courseId: string;
    courseName: string;
    message: string;
}