import { z } from 'zod';

export const RecentCourseCardZod = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    image_url: z.string().optional(),
    completion_percent: z.number(),
});
export type RecentCourseCard = z.infer<typeof RecentCourseCardZod>;

export const RecentCertificateZod = z.object({
    course_title: z.string(),
    issued_at: z.string(),
});
export type RecentCertificate = z.infer<typeof RecentCertificateZod>;

export const UserDashboardZod = z.object({
    enrolled_courses_count: z.number(),
    completed_courses_count: z.number(),
    in_progress_courses_count: z.number(),
    certificates_count: z.number(),
    recent_courses: z.array(RecentCourseCardZod),
    recent_certificates: z.array(RecentCertificateZod),
});
export type UserDashboard = z.infer<typeof UserDashboardZod>;

export const TutorRecentTransactionZod = z.object({
    user_name: z.string(),
    course_title: z.string(),
    amount: z.number(),
    date: z.string(),
});
export type TutorRecentTransaction = z.infer<typeof TutorRecentTransactionZod>;

export const TutorCourseStatZod = z.object({
    course_id: z.string(),
    title: z.string(),
    students: z.number(),
    revenue: z.number(),
});
export type TutorCourseStat = z.infer<typeof TutorCourseStatZod>;

export const TutorDashboardZod = z.object({
    total_courses: z.number(),
    published_courses: z.number(),
    draft_courses: z.number(),
    total_students: z.number(),
    total_revenue: z.number(),
    rating_avg: z.number(),
    recent_transactions: z.array(TutorRecentTransactionZod),
    course_stats: z.array(TutorCourseStatZod),
});
export type TutorDashboard = z.infer<typeof TutorDashboardZod>;

export const AdminRecentTransactionZod = z.object({
    id: z.string(),
    user_id: z.string().optional(),
    course_id: z.string().optional(),
    amount: z.number(),
    status: z.string(),
    created_at: z.string(),
});
export type AdminRecentTransaction = z.infer<typeof AdminRecentTransactionZod>;

export const AdminTopCourseZod = z.object({
    title: z.string(),
    students: z.number(),
    revenue: z.number(),
});
export type AdminTopCourse = z.infer<typeof AdminTopCourseZod>;

export const UserGrowthZod = z.object({
    month: z.string(),
    count: z.number(),
});
export type UserGrowth = z.infer<typeof UserGrowthZod>;

export const AdminDashboardZod = z.object({
    total_users: z.number(),
    total_tutors: z.number(),
    total_courses: z.number(),
    total_enrollments: z.number(),
    total_revenue: z.number(),
    revenue_this_month: z.number(),
    recent_transactions: z.array(AdminRecentTransactionZod),
    top_courses: z.array(AdminTopCourseZod),
    user_growth: z.array(UserGrowthZod),
});
export type AdminDashboard = z.infer<typeof AdminDashboardZod>;
export const UserDashboardZod = z.any(); export type UserDashboard = any;
