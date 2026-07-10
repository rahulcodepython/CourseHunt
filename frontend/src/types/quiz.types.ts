import { z } from 'zod';

// ── DB Row Structs ────────────────────────────────────────────────────────────

export const QuizMetadataZod = z.object({
    id: z.string(),
    lesson_id: z.string(),
    title: z.string(),
    time_limit_seconds: z.number(),
    total_questions: z.number(),
    pass_score_percent: z.number(),
});
export type QuizMetadata = z.infer<typeof QuizMetadataZod>;

export const QuizQuestionZod = z.object({
    id: z.string(),
    quiz_id: z.string(),
    question_type: z.string(),
    question_text: z.string(),
    points: z.number(),
    fill_blank_hint: z.string().optional(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionZod>;

export const QuizOptionZod = z.object({
    id: z.string(),
    question_id: z.string(),
    option_text: z.string(),
    is_correct: z.boolean().optional(),
});
export type QuizOption = z.infer<typeof QuizOptionZod>;

export const QuizArrangeItemZod = z.object({
    id: z.string(),
    question_id: z.string(),
    item_text: z.string(),
    correct_order: z.number(),
});
export type QuizArrangeItem = z.infer<typeof QuizArrangeItemZod>;

export const QuizAttemptZod = z.object({
    id: z.string(),
    quiz_id: z.string(),
    user_id: z.string(),
    started_at: z.string(),
    submitted_at: z.string().optional(),
    total_score: z.number().optional(),
    passed: z.boolean().optional(),
    correct_count: z.number(),
    incorrect_count: z.number(),
    skipped_count: z.number(),
});
export type QuizAttempt = z.infer<typeof QuizAttemptZod>;

export const QuestionValidationZod = z.object({
    id: z.string(),
    question_type: z.string(),
    points: z.number(),
    correct_option_ids: z.array(z.string()).nullable().optional(), // Fallback for Go null slices
    correct_arrange_order: z.array(z.number()).nullable().optional(),
    correct_fill_answers: z.array(z.string()).nullable().optional(),
});
export type QuestionValidation = z.infer<typeof QuestionValidationZod>;

// ── Quiz Requests ─────────────────────────────────────────────────────────────

export const CreateQuizRequestZod = z.object({
    title: z.string(),
    time_limit_seconds: z.number(),
    pass_score_percent: z.number(),
});
export type CreateQuizRequest = z.infer<typeof CreateQuizRequestZod>;

export const QuestionOptionInputZod = z.object({
    option_text: z.string(),
    is_correct: z.boolean(),
});
export type QuestionOptionInput = z.infer<typeof QuestionOptionInputZod>;

export const QuestionArrangeItemInputZod = z.object({
    item_text: z.string(),
    correct_order: z.number(),
});
export type QuestionArrangeItemInput = z.infer<typeof QuestionArrangeItemInputZod>;

export const CreateQuestionRequestZod = z.object({
    question_type: z.string(),
    question_text: z.string(),
    points: z.number(),
    fill_blank_hint: z.string().optional(),
    options: z.array(QuestionOptionInputZod).nullable().optional(),
    arrange_items: z.array(QuestionArrangeItemInputZod).nullable().optional(),
    fill_answers: z.array(z.string()).nullable().optional(),
});
export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestZod>;

export const NextQuestionRequestZod = z.object({
    fetched_question_ids: z.array(z.string()).nullable().optional(),
});
export type NextQuestionRequest = z.infer<typeof NextQuestionRequestZod>;

export const SubmitQuizAnswerInputZod = z.object({
    question_id: z.string(),
    selected_option_ids: z.array(z.string()).nullable().optional(),
    arrange_order: z.array(z.number()).nullable().optional(),
    fill_text: z.string().optional(),
    is_skipped: z.boolean(),
});
export type SubmitQuizAnswerInput = z.infer<typeof SubmitQuizAnswerInputZod>;

export const SubmitQuizRequestZod = z.object({
    answers: z.array(SubmitQuizAnswerInputZod),
});
export type SubmitQuizRequest = z.infer<typeof SubmitQuizRequestZod>;

// ── Quiz Responses ────────────────────────────────────────────────────────────

export const QuizOptionPublicZod = z.object({
    id: z.string(),
    option_text: z.string(),
});
export type QuizOptionPublic = z.infer<typeof QuizOptionPublicZod>;

export const QuizArrangeItemPublicZod = z.object({
    id: z.string(),
    item_text: z.string(),
});
export type QuizArrangeItemPublic = z.infer<typeof QuizArrangeItemPublicZod>;

export const QuestionForAttemptZod = z.object({
    id: z.string(),
    question_type: z.string(),
    question_text: z.string(),
    points: z.number(),
    options: z.array(QuizOptionPublicZod).nullable().optional(),
    arrange_items: z.array(QuizArrangeItemPublicZod).nullable().optional(),
    fill_blank_hint: z.string().optional(),
});
export type QuestionForAttempt = z.infer<typeof QuestionForAttemptZod>;

export const NextQuestionResponseZod = z.object({
    question: QuestionForAttemptZod.optional(),
    remaining_questions: z.number(),
});
export type NextQuestionResponse = z.infer<typeof NextQuestionResponseZod>;

export const QuizResultItemZod = z.object({
    question_id: z.string(),
    is_correct: z.boolean(),
    correct_option_ids: z.array(z.string()).nullable().optional(),
    correct_arrange_order: z.array(z.number()).nullable().optional(),
    correct_fill_answers: z.array(z.string()).nullable().optional(),
});
export type QuizResultItem = z.infer<typeof QuizResultItemZod>;

export const SubmitQuizResponseZod = z.object({
    attempt_id: z.string(),
    total_score: z.number(),
    correct_count: z.number(),
    incorrect_count: z.number(),
    skipped_count: z.number(),
    passed: z.boolean(),
    results: z.array(QuizResultItemZod).nullable().optional(),
});
export type SubmitQuizResponse = z.infer<typeof SubmitQuizResponseZod>;