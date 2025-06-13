export type User = {
    id: number;
    name: string;
    email: string;
    dateOfJoining: string;
    status: "Active" | "Inactive";
    coursesEnrolled: number;
    avatar: string;
};