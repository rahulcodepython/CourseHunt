export type UserType = {
    _id: string;
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
    avatar: {
        url: string;
        fileType: string;
    };
    password?: string;
    createdAt: Date;
    purchasedCourses: number;
};

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
    avatar: {
        url: string;
        fileType: string;
    };
}