export type User = {
    _id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    avatar: string;
    password: string;
    createdAt: Date;
};