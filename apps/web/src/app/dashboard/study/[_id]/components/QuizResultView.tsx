"use client";

import { Button } from "@package/ui/button";
import { Icon } from "@package/components/icon";

interface QuizResultViewProps {
	passed: boolean;
	totalScore: number;
	passScorePercent: number;
	onRetake: () => void;
}

export function QuizResultView({ passed, totalScore, passScorePercent, onRetake }: QuizResultViewProps) {
	return (
		<div className="text-center max-w-sm space-y-4 py-8 mx-auto">
			<Icon
				name={passed ? "IconCircleCheck" : "IconAlertCircle"}
				className={`w-12 h-12 mx-auto ${passed ? "text-green-500" : "text-red-500"}`}
			/>
			<h3 className="font-bold text-lg">{passed ? "Congratulations!" : "Keep Trying!"}</h3>
			<p className="text-sm">
				Your score is <span className="font-bold">{totalScore}%</span> (Required: {passScorePercent}%)
			</p>
			<Button onClick={onRetake} variant="outline" className="w-full mt-2 cursor-pointer">
				Retake Quiz
			</Button>
		</div>
	);
}
