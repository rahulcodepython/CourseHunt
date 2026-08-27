import type { SubmitQuizRequest } from "@/schema/quiz.types";

export type AnswerDraft =
  | { type: "single_choice"; question_id: string; selected_option_id: string; is_skipped?: boolean }
  | { type: "multi_choice"; question_id: string; selected_option_ids: string[]; is_skipped?: boolean }
  | { type: "arrange"; question_id: string; items: { item_id: string; order: number }[]; is_skipped?: boolean }
  | { type: "fill_blank"; question_id: string; fill_text: string; is_skipped?: boolean };

export function buildSubmitRequest(answers: AnswerDraft[]): SubmitQuizRequest {
  return {
    single_answers: answers
      .filter((a): a is Extract<AnswerDraft, { type: "single_choice" }> => a.type === "single_choice")
      .map(({ question_id, selected_option_id, is_skipped }) => ({ question_id, selected_option_id, is_skipped })),
    multi_answers: answers
      .filter((a): a is Extract<AnswerDraft, { type: "multi_choice" }> => a.type === "multi_choice")
      .map(({ question_id, selected_option_ids, is_skipped }) => ({ question_id, selected_option_ids, is_skipped })),
    arrange_answers: answers
      .filter((a): a is Extract<AnswerDraft, { type: "arrange" }> => a.type === "arrange")
      .map(({ question_id, items, is_skipped }) => ({ question_id, items, is_skipped })),
    fill_answers: answers
      .filter((a): a is Extract<AnswerDraft, { type: "fill_blank" }> => a.type === "fill_blank")
      .map(({ question_id, fill_text, is_skipped }) => ({ question_id, fill_text, is_skipped })),
  };
}
