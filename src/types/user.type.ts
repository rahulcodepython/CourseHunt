export type UserType = {
    _id: number;
    name: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    zip?: string;
    email: string;
    role: 'admin' | 'user';
    avatar: string;
    password?: string;
    createdAt: Date;
    purchasedCourses?: Array<{
        _id: string;
        name: string;
    }>;
};