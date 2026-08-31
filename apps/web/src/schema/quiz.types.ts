import { z } from "zod";

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
  fill_blank_hint: z.string().nullable().optional(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionZod>;

export const QuizOptionZod = z.object({
  id: z.string(),
  question_id: z.string(),
  option_text: z.string(),
  is_correct: z.boolean().optional(),
  sort_order: z.number().optional(),
});
export type QuizOption = z.infer<typeof QuizOptionZod>;

export const QuizArrangeItemZod = z.object({
  id: z.string(),
  question_id: z.string(),
  item_text: z.string(),
  correct_order: z.number(),
});
export type QuizArrangeItem = z.infer<typeof QuizArrangeItemZod>;

export const QuizFillBlankAnswerZod = z.object({
  id: z.string(),
  question_id: z.string(),
  answer: z.string(),
});
export type QuizFillBlankAnswer = z.infer<typeof QuizFillBlankAnswerZod>;

export const QuizQuestionDetailZod = z.object({
  id: z.string(),
  quiz_id: z.string(),
  question_type: z.string(),
  question_text: z.string(),
  points: z.number(),
  fill_blank_hint: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  options: z.array(QuizOptionZod).nullable().optional(),
  arrange_items: z.array(QuizArrangeItemZod).nullable().optional(),
  fill_answers: z.array(QuizFillBlankAnswerZod).nullable().optional(),
});
export type QuizQuestionDetail = z.infer<typeof QuizQuestionDetailZod>;

export const QuestionValidationZod = z.object({
  id: z.string(),
  question_type: z.string(),
  points: z.number(),
  correct_option_ids: z.array(z.string()),
  correct_arrange_order: z.array(z.number()),
  correct_fill_answers: z.array(z.string()),
});
export type QuestionValidation = z.infer<typeof QuestionValidationZod>;

export const CreateQuizRequestZod = z.object({
  title: z.string(),
  time_limit_seconds: z.number(),
  pass_score_percent: z.number(),
});
export type CreateQuizRequest = z.infer<typeof CreateQuizRequestZod>;

export const QuestionOptionInputZod = z.object({
  option_text: z.string(),
  is_correct: z.boolean(),
  sort_order: z.number().optional(),
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
  fill_blank_hint: z.string().nullable().optional(),
  options: z.array(QuestionOptionInputZod).nullable().optional(),
  arrange_items: z.array(QuestionArrangeItemInputZod).nullable().optional(),
  fill_answers: z.array(z.string()).nullable().optional(),
});
export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestZod>;

export const NextQuestionRequestZod = z.object({
  fetched_question_ids: z.array(z.string()).nullable().optional(),
});
export type NextQuestionRequest = z.infer<typeof NextQuestionRequestZod>;

export const SubmitSingleAnswerInputZod = z.object({
  question_id: z.string(),
  selected_option_id: z.string(),
  is_skipped: z.boolean().optional(),
});
export type SubmitSingleAnswerInput = z.infer<typeof SubmitSingleAnswerInputZod>;

export const SubmitMultiAnswerInputZod = z.object({
  question_id: z.string(),
  selected_option_ids: z.array(z.string()),
  is_skipped: z.boolean().optional(),
});
export type SubmitMultiAnswerInput = z.infer<typeof SubmitMultiAnswerInputZod>;

export const ArrangeSubmittedItemZod = z.object({
  item_id: z.string(),
  order: z.number(),
});
export type ArrangeSubmittedItem = z.infer<typeof ArrangeSubmittedItemZod>;

export const SubmitArrangeAnswerInputZod = z.object({
  question_id: z.string(),
  items: z.array(ArrangeSubmittedItemZod),
  is_skipped: z.boolean().optional(),
});
export type SubmitArrangeAnswerInput = z.infer<typeof SubmitArrangeAnswerInputZod>;

export const SubmitFillAnswerInputZod = z.object({
  question_id: z.string(),
  fill_text: z.string(),
  is_skipped: z.boolean().optional(),
});
export type SubmitFillAnswerInput = z.infer<typeof SubmitFillAnswerInputZod>;

export const SubmitQuizRequestZod = z.object({
  single_answers: z.array(SubmitSingleAnswerInputZod).optional(),
  multi_answers: z.array(SubmitMultiAnswerInputZod).optional(),
  arrange_answers: z.array(SubmitArrangeAnswerInputZod).optional(),
  fill_answers: z.array(SubmitFillAnswerInputZod).optional(),
});
export type SubmitQuizRequest = z.infer<typeof SubmitQuizRequestZod>;

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
  fill_blank_hint: z.string().nullable().optional(),
});
export type QuestionForAttempt = z.infer<typeof QuestionForAttemptZod>;

export const NextQuestionResponseZod = z.object({
  question: QuestionForAttemptZod.nullable().optional(),
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

export const QuizAttemptSummaryZod = z.object({
  id: z.string(),
  started_at: z.string(),
  submitted_at: z.string().nullable().optional(),
  total_score: z.number(),
  passed: z.boolean(),
  correct_count: z.number(),
  incorrect_count: z.number(),
  skipped_count: z.number(),
});
export type QuizAttemptSummary = z.infer<typeof QuizAttemptSummaryZod>;

export const QuizAttemptOptionBreakdownZod = z.object({
  option_id: z.string(),
  option_text: z.string(),
  is_correct: z.boolean(),
  is_selected: z.boolean(),
});
export type QuizAttemptOptionBreakdown = z.infer<typeof QuizAttemptOptionBreakdownZod>;

export const QuizAttemptArrangeBreakdownZod = z.object({
  item_id: z.string(),
  item_text: z.string(),
  correct_order: z.number(),
  submitted_order: z.number().nullable(),
});
export type QuizAttemptArrangeBreakdown = z.infer<typeof QuizAttemptArrangeBreakdownZod>;

export const QuizAttemptQuestionBreakdownZod = z.object({
  question_id: z.string(),
  question_type: z.string(),
  question_text: z.string(),
  points: z.number(),
  is_correct: z.boolean(),
  is_skipped: z.boolean(),
  your_answer: z.string(),
  correct_answer: z.string(),
  options: z.array(QuizAttemptOptionBreakdownZod),
  arrange_items: z.array(QuizAttemptArrangeBreakdownZod),
  fill_answers: z.array(z.string()),
});
export type QuizAttemptQuestionBreakdown = z.infer<typeof QuizAttemptQuestionBreakdownZod>;

export const QuizAttemptDetailZod = z.object({
  attempt_id: z.string(),
  quiz_title: z.string(),
  total_score: z.number(),
  passed: z.boolean(),
  questions: z.array(QuizAttemptQuestionBreakdownZod),
});
export type QuizAttemptDetail = z.infer<typeof QuizAttemptDetailZod>;
