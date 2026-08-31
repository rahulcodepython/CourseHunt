"use client";

import * as React from "react";

import { useGetQuestionMutation, useSubmitQuizMutation } from "@/query-hooks/quiz.api";
import { useCompleteLessonMutation } from "@/query-hooks/lessons.api";
import type { QuizMetadataMini } from "@/schema/lessons.types";
import type { QuestionForAttempt, SubmitQuizResponse } from "@/schema/quiz.types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/icon";
import { formatDuration } from "@/lib/format";
import { QuizQuestionView } from "./quiz-question-view";
import { QuizResultView } from "./quiz-result-view";
import { QuizAttemptBreakdown } from "./quiz-attempt-breakdown";
import { buildSubmitRequest, type AnswerDraft } from "./types";

type Phase = "intro" | "loading" | "question" | "submitting" | "result";

export function QuizPlayer({
  quiz,
  courseId,
  lessonId,
}: {
  quiz: QuizMetadataMini;
  courseId: string;
  lessonId: string;
}) {
  const [phase, setPhase] = React.useState<Phase>("intro");
  const [question, setQuestion] = React.useState<QuestionForAttempt | null>(null);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [result, setResult] = React.useState<SubmitQuizResponse | null>(null);
  const [breakdownOpen, setBreakdownOpen] = React.useState(false);

  const getQuestion = useGetQuestionMutation();
  const submitQuiz = useSubmitQuizMutation();
  const completeLesson = useCompleteLessonMutation(courseId);

  const submit = React.useCallback(
    async (finalAnswers: AnswerDraft[]) => {
      setPhase("submitting");
      const res = await submitQuiz.execute({
        quizId: quiz.id,
        data: buildSubmitRequest(finalAnswers),
      });
      if (!res?.data) {
        setPhase("intro");
        return;
      }
      setResult(res.data);
      setPhase("result");
      if (res.data.passed) completeLesson.execute(lessonId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quiz.id, lessonId],
  );

  const fetchNext = React.useCallback(
    async (fetchedIds: string[], finalAnswers: AnswerDraft[]) => {
      setPhase("loading");
      const res = await getQuestion.execute({
        quizId: quiz.id,
        data: { fetched_question_ids: fetchedIds },
      });
      if (!res?.data?.question) {
        await submit(finalAnswers);
        return;
      }
      setQuestion(res.data.question);
      setPhase("question");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quiz.id, submit],
  );

  const [fetchedIds, setFetchedIds] = React.useState<string[]>([]);
  const [answers, setAnswers] = React.useState<AnswerDraft[]>([]);

  const handleStart = () => {
    setResult(null);
    setQuestionIndex(0);
    setFetchedIds([]);
    setAnswers([]);
    fetchNext([], []);
  };

  const handleAnswer = (draft: AnswerDraft) => {
    const nextAnswers = [...answers, draft];
    const nextIds = question ? [...fetchedIds, question.id] : fetchedIds;
    setAnswers(nextAnswers);
    setFetchedIds(nextIds);
    setQuestionIndex((i) => i + 1);
    fetchNext(nextIds, nextAnswers);
  };

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Icon name="help-circle" className="size-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-semibold">{quiz.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {quiz.total_questions} questions &middot; {formatDuration(quiz.time_limit_seconds)} time
            limit &middot; pass at {quiz.pass_score_percent}%
          </p>
        </div>
        <Button onClick={handleStart}>Start Quiz</Button>
        <p className="text-xs text-muted-foreground">
          Check the Attempts tab below to review your past results.
        </p>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <>
        <QuizResultView
          result={result}
          passScorePercent={quiz.pass_score_percent}
          onRetake={handleStart}
          onViewBreakdown={() => setBreakdownOpen(true)}
        />
        <Dialog open={breakdownOpen} onOpenChange={setBreakdownOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Attempt Breakdown</DialogTitle>
            </DialogHeader>
            <QuizAttemptBreakdown
              attemptId={result.attempt_id}
              onBack={() => setBreakdownOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (question && phase === "question") {
    return (
      <QuizQuestionView
        key={question.id}
        question={question}
        index={questionIndex}
        total={quiz.total_questions}
        onSubmit={handleAnswer}
      />
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
