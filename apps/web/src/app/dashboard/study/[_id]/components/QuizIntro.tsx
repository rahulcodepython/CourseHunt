"use client";

import { Button } from "@package/ui/button";
import { Icon } from "@package/components/icon";

interface QuizIntroProps {
	title: string;
	totalQuestions: number;
	timeLimitSeconds: number;
	passScorePercent: number;
	onStart: () => void;
}

export function QuizIntro({ title, totalQuestions, timeLimitSeconds, passScorePercent, onStart }: QuizIntroProps) {
	return (
		<div className="text-center max-w-sm space-y-4 py-8 mx-auto">
			<Icon name="IconHelp" className="w-12 h-12 text-primary mx-auto" />
			<h3 className="font-bold text-base">{title}</h3>
			<div className="flex justify-center gap-6 text-xs text-muted-foreground">
				<span>Questions: {totalQuestions}</span>
				<span>Time Limit: {timeLimitSeconds}s</span>
				<span>Pass Score: {passScorePercent}%</span>
			</div>
			<Button onClick={onStart} className="w-full mt-4 text-white bg-primary cursor-pointer">
				Start Quiz
			</Button>
		</div>
	);
}
