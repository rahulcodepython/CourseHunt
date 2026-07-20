"use client";

import { Button } from "@package/ui/button";

interface QuizOption {
	id: string;
	option_text: string;
}

interface QuizQuestionViewProps {
	questionText: string;
	options: QuizOption[];
	selectedAnswer: string | null;
	onSelectAnswer: (optionId: string) => void;
	questionNumber: number;
	totalQuestions: number;
	isLastQuestion: boolean;
	onNext: () => void;
}

export function QuizQuestionView({
	questionText,
	options,
	selectedAnswer,
	onSelectAnswer,
	questionNumber,
	totalQuestions,
	isLastQuestion,
	onNext,
}: QuizQuestionViewProps) {
	return (
		<div className="w-full max-w-lg space-y-6 py-6 mx-auto">
			<div className="flex justify-between items-center text-xs text-muted-foreground border-b pb-2">
				<span>Question {questionNumber} of {totalQuestions}</span>
			</div>
			<h3 className="font-semibold text-sm leading-snug">{questionText}</h3>
			<div className="grid gap-3 pt-2">
				{options.map((option) => (
					<button
						key={option.id}
						onClick={() => onSelectAnswer(option.id)}
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
			<Button disabled={!selectedAnswer} onClick={onNext} className="w-full text-white bg-primary mt-6 cursor-pointer">
				{isLastQuestion ? "Submit Quiz" : "Next Question"}
			</Button>
		</div>
	);
}
