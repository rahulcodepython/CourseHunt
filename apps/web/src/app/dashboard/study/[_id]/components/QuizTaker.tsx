"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@package/ui/button";
import { Icon } from "@/components/icon";
import Loading from "@/components/loading";
import { useGetQuestionMutation, useSubmitQuizMutation } from "@package/query-hooks/quiz.api";
import type { SubmitQuizAnswerInput } from "@package/schema/quiz.types";
import { toast } from "sonner";

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
	const [userAnswers, setUserAnswers] = useState<SubmitQuizAnswerInput[]>([]);
	const [fetchedQuestionIds, setFetchedQuestionIds] = useState<string[]>([]);
	const [quizResult, setQuizResult] = useState<any>(null);

	const getQuestionMutation = useGetQuestionMutation();
	const submitQuizMutation = useSubmitQuizMutation();

	useEffect(() => {
		setQuizStarted(false);
		setCurrentQuestion(null);
		setRemainingQuestions(0);
		setSelectedAnswer(null);
		setUserAnswers([]);
		setFetchedQuestionIds([]);
		setQuizResult(null);
	}, [quizMetadata.id]);

	const startQuiz = async () => {
		setQuizStarted(true);
		setQuizResult(null);
		setSelectedAnswer(null);
		setUserAnswers([]);
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

		const newAnswer: SubmitQuizAnswerInput = {
			question_id: currentQuestion.id,
			selected_option_ids: selectedAnswer ? [selectedAnswer] : [],
			is_skipped: !selectedAnswer,
		};

		const updatedAnswers = [...userAnswers, newAnswer];
		setUserAnswers(updatedAnswers);

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
				data: { answers: updatedAnswers },
			});
			if (res?.data) {
				setQuizResult(res.data);
			}
		}
	};

	if (!quizStarted) {
		return (
			<div className="text-center max-w-sm space-y-4 py-8 mx-auto">
				<Icon name="IconHelp" className="w-12 h-12 text-primary mx-auto" />
				<h3 className="font-bold text-base">{quizMetadata.title}</h3>
				<div className="flex justify-center gap-6 text-xs text-muted-foreground">
					<span>Questions: {quizMetadata.total_questions}</span>
					<span>Time Limit: {quizMetadata.time_limit_seconds}s</span>
					<span>Pass Score: {quizMetadata.pass_score_percent}%</span>
				</div>
				<Button onClick={startQuiz} className="w-full mt-4 text-white bg-primary cursor-pointer">
					Start Quiz
				</Button>
			</div>
		);
	}

	if (quizResult) {
		return (
			<div className="text-center max-w-sm space-y-4 py-8 mx-auto">
				<Icon
					name={quizResult.passed ? "IconCircleCheck" : "IconAlertCircle"}
					className={`w-12 h-12 mx-auto ${quizResult.passed ? "text-green-500" : "text-red-500"}`}
				/>
				<h3 className="font-bold text-lg">{quizResult.passed ? "Congratulations!" : "Keep Trying!"}</h3>
				<p className="text-sm">
					Your score is <span className="font-bold">{quizResult.total_score}%</span> (Required: {quizMetadata.pass_score_percent}%)
				</p>
				<Button onClick={startQuiz} variant="outline" className="w-full mt-2 cursor-pointer">
					Retake Quiz
				</Button>
			</div>
		);
	}

	if (getQuestionMutation.isPending) return <Loading />;

	return (
		<div className="w-full max-w-lg space-y-6 py-6 mx-auto">
			<div className="flex justify-between items-center text-xs text-muted-foreground border-b pb-2">
				<span>Question {fetchedQuestionIds.length} of {quizMetadata.total_questions}</span>
			</div>
			{currentQuestion ? (
				<>
					<h3 className="font-semibold text-sm leading-snug">{currentQuestion.question_text}</h3>
					<div className="grid gap-3 pt-2">
						{currentQuestion.options?.map((option: any) => (
							<button
								key={option.id}
								onClick={() => setSelectedAnswer(option.id)}
								className={`flex items-center text-left p-3.5 rounded-lg border text-xs cursor-pointer bg-transparent transition-all ${
									selectedAnswer === option.id
										? "border-primary bg-primary/5 text-primary font-medium"
										: "border-muted hover:bg-muted/30"
								}`}
							>
								{option.option_text}
							</button>
						))}
					</div>
					<Button
						disabled={!selectedAnswer}
						onClick={handleNextQuestion}
						className="w-full text-white bg-primary mt-6 cursor-pointer"
					>
						{remainingQuestions > 0 ? "Next Question" : "Submit Quiz"}
					</Button>
				</>
			) : (
				<Loading />
			)}
		</div>
	);
}
