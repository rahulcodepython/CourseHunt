"use client";

import React, { useEffect, useState } from "react";
import Loading from "@package/components/loading";
import { useGetQuestionMutation, useSubmitQuizMutation } from "@package/query-hooks/quiz.api";
import type { SubmitSingleAnswerInput } from "@package/schema/quiz.types";
import { toast } from "sonner";
import { QuizIntro } from "./QuizIntro";
import { QuizResultView } from "./QuizResultView";
import { QuizQuestionView } from "./QuizQuestionView";

interface QuizTakerProps {
	quizMetadata: {
		id: string;
		title: string;
		total_questions: number;
		time_limit_seconds: number;
		pass_score_percent: number;
	};
}

export function QuizTaker({ quizMetadata }: QuizTakerProps) {
	const [quizStarted, setQuizStarted] = useState(false);
	const [currentQuestion, setCurrentQuestion] = useState<any>(null);
	const [remainingQuestions, setRemainingQuestions] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [singleAnswers, setSingleAnswers] = useState<SubmitSingleAnswerInput[]>([]);
	const [fetchedQuestionIds, setFetchedQuestionIds] = useState<string[]>([]);
	const [quizResult, setQuizResult] = useState<any>(null);

	const getQuestionMutation = useGetQuestionMutation();
	const submitQuizMutation = useSubmitQuizMutation();

	useEffect(() => {
		setQuizStarted(false);
		setCurrentQuestion(null);
		setRemainingQuestions(0);
		setSelectedAnswer(null);
		setSingleAnswers([]);
		setFetchedQuestionIds([]);
		setQuizResult(null);
	}, [quizMetadata.id]);

	const startQuiz = async () => {
		setQuizStarted(true);
		setQuizResult(null);
		setSelectedAnswer(null);
		setSingleAnswers([]);
		setFetchedQuestionIds([]);

		const res = await getQuestionMutation.execute({
			quizId: quizMetadata.id,
			data: { fetched_question_ids: [] },
		});
		if (res?.data?.question) {
			setCurrentQuestion(res.data.question);
			setRemainingQuestions(res.data.remaining_questions);
			setFetchedQuestionIds([res.data.question.id]);
		} else {
			toast.error("No questions found in this quiz");
			setQuizStarted(false);
		}
	};

	const handleNextQuestion = async () => {
		if (!currentQuestion) return;

		const newAnswer: SubmitSingleAnswerInput = {
			question_id: currentQuestion.id,
			selected_option_id: selectedAnswer || "",
			is_skipped: !selectedAnswer,
		};

		const updatedAnswers = [...singleAnswers, newAnswer];
		setSingleAnswers(updatedAnswers);

		if (remainingQuestions > 0) {
			const updatedFetchedIds = [...fetchedQuestionIds, currentQuestion.id];
			setFetchedQuestionIds(updatedFetchedIds);
			setSelectedAnswer(null);

			const res = await getQuestionMutation.execute({
				quizId: quizMetadata.id,
				data: { fetched_question_ids: updatedFetchedIds },
			});
			if (res?.data?.question) {
				const questionId = res.data.question.id;
				setCurrentQuestion(res.data.question);
				setRemainingQuestions(res.data.remaining_questions);
				setFetchedQuestionIds((prev) => [...prev, questionId]);
			}
		} else {
			const res = await submitQuizMutation.execute({
				quizId: quizMetadata.id,
				data: { single_answers: updatedAnswers },
			});
			if (res?.data) {
				setQuizResult(res.data);
			}
		}
	};

	if (!quizStarted) {
		return (
			<QuizIntro
				title={quizMetadata.title}
				totalQuestions={quizMetadata.total_questions}
				timeLimitSeconds={quizMetadata.time_limit_seconds}
				passScorePercent={quizMetadata.pass_score_percent}
				onStart={startQuiz}
			/>
		);
	}

	if (quizResult) {
		return (
			<QuizResultView
				passed={quizResult.passed}
				totalScore={quizResult.total_score}
				passScorePercent={quizMetadata.pass_score_percent}
				onRetake={startQuiz}
			/>
		);
	}

	if (getQuestionMutation.isPending || !currentQuestion) return <Loading />;

	return (
		<QuizQuestionView
			questionText={currentQuestion.question_text}
			options={currentQuestion.options ?? []}
			selectedAnswer={selectedAnswer}
			onSelectAnswer={setSelectedAnswer}
			questionNumber={fetchedQuestionIds.length}
			totalQuestions={quizMetadata.total_questions}
			isLastQuestion={remainingQuestions === 0}
			onNext={handleNextQuestion}
		/>
	);
}
