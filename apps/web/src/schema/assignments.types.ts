import { z } from "zod";

export const AssignmentZod = z.object({
  id: z.string(),
  course_id: z.string(),
  chapter_id: z.string().nullable().optional(),
  title: z.string(),
  description: z.string(),
  max_score: z.number(),
  pass_score: z.number(),
  due_date: z.string().nullable().optional(),
  is_published: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Assignment = z.infer<typeof AssignmentZod>;

export const AssignmentSubmissionZod = z.object({
  id: z.string(),
  assignment_id: z.string(),
  user_id: z.string(),
  github_repo_url: z.string().nullable().optional(),
  live_demo_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  feedback: z.string().nullable().optional(),
  status: z.string(),
  graded_by: z.string().nullable().optional(),
  graded_at: z.string().nullable().optional(),
  submitted_at: z.string(),
  updated_at: z.string(),
});
export type AssignmentSubmission = z.infer<typeof AssignmentSubmissionZod>;

export const CreateAssignmentRequestZod = z.object({
  course_id: z.string().min(1, "Course ID is required"),
  chapter_id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  max_score: z.number().min(1).default(100),
  pass_score: z.number().min(0).default(60),
  due_date: z.string().optional(),
  is_published: z.boolean().default(true),
});
export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestZod>;

export const SubmitAssignmentRequestZod = z.object({
  github_repo_url: z.string().url().optional().or(z.literal("")),
  live_demo_url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});
export type SubmitAssignmentRequest = z.infer<typeof SubmitAssignmentRequestZod>;

export const GradeAssignmentRequestZod = z.object({
  score: z.number().min(0),
  feedback: z.string().min(1, "Feedback is required"),
  status: z.enum(["graded", "rejected"]).default("graded"),
});
export type GradeAssignmentRequest = z.infer<typeof GradeAssignmentRequestZod>;
