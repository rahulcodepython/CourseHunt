"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { useCreateQuizMutation, useCreateQuestionMutation, useDeleteQuestionMutation } from "@package/query-hooks/quiz.api";
import { useState } from "react";
import { toast } from "sonner";
import { Icon } from "@package/components/icon";
import { ConfirmDeleteDialog } from "@package/components/confirm-delete-dialog";
import type { QuizMetadata, QuizQuestion } from "@package/schema/quiz.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@package/ui/dialog";
import { Badge } from "@package/ui/badge";

interface QuizContentEditorProps {
	lessonId: string;
	quiz?: QuizMetadata & { questions?: QuizQuestion[] };
}

export function QuizContentEditor({ lessonId, quiz }: QuizContentEditorProps) {
	const createQuiz = useCreateQuizMutation();
	const createQuestion = useCreateQuestionMutation();
	const deleteQuestion = useDeleteQuestionMutation();

	// Create quiz state
	const [quizTitle, setQuizTitle] = useState(quiz?.title || "");
	const [timeLimit, setTimeLimit] = useState(quiz?.time_limit_seconds || 600);
	const [passScore, setPassScore] = useState(quiz?.pass_score_percent || 50);

	// Create question state
	const [questionOpen, setQuestionOpen] = useState(false);
	const [qText, setQText] = useState("");
	const [options, setOptions] = useState(["", ""]);
	const [correctIndex, setCorrectIndex] = useState(0);

	// Delete question state
	const [deleteQId, setDeleteQId] = useState<string | null>(null);

	const handleSaveQuiz = async () => {
		if (!quizTitle.trim()) return toast.error("Quiz title is required");
		await createQuiz.execute({
			lessonId,
			data: { title: quizTitle, time_limit_seconds: timeLimit, pass_score_percent: passScore }
		});
	};

	const handleAddOption = () => setOptions([...options, ""]);
	const handleRemoveOption = (idx: number) => {
		if (options.length <= 2) return toast.error("A question needs at least 2 options");
		setOptions(options.filter((_, i) => i !== idx));
		if (correctIndex >= options.length - 1) setCorrectIndex(0);
	};

	const handleSaveQuestion = async () => {
		if (!quiz) return;
		if (!qText.trim()) return toast.error("Question text is required");
		if (options.some((o) => !o.trim())) return toast.error("All options must have text");

		const res = await createQuestion.execute({
			quizId: quiz.id,
			data: {
				question_type: "single_choice",
				question_text: qText,
				points: 1,
				options: options.map((opt, i) => ({
					option_text: opt,
					is_correct: i === correctIndex
				})),
			}
		});

		if (res) {
			setQuestionOpen(false);
			setQText("");
			setOptions(["", ""]);
			setCorrectIndex(0);
		}
	};

	const handleDeleteQuestion = async () => {
		if (deleteQId) {
			await deleteQuestion.execute(deleteQId);
			setDeleteQId(null);
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader><CardTitle>Quiz Settings</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Quiz Title</Label>
						<Input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Time Limit (seconds)</Label>
							<Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
						</div>
						<div className="space-y-2">
							<Label>Passing Score (%)</Label>
							<Input type="number" min={1} max={100} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))} />
						</div>
					</div>
					<Button onClick={handleSaveQuiz} disabled={createQuiz.isPending}>
						<Icon name="IconDeviceFloppy" className="w-4 h-4 mr-1" />
						{quiz ? "Update Quiz Settings" : "Create Quiz"}
					</Button>
				</CardContent>
			</Card>

			{quiz && (
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Questions ({quiz.total_questions})</CardTitle>
						<Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
							<DialogTrigger asChild>
								<Button size="sm">
									<Icon name="IconPlus" className="w-4 h-4 mr-1" /> Add Question
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
								<DialogHeader><DialogTitle>Add Question</DialogTitle></DialogHeader>
								<div className="space-y-4 pt-4">
									<div className="space-y-2">
										<Label>Question</Label>
										<Input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="What is..." />
									</div>
									<div className="space-y-3">
										<Label className="flex justify-between items-center">
											Options
											<Button type="button" variant="ghost" size="sm" onClick={handleAddOption}>
												<Icon name="IconPlus" className="w-4 h-4 mr-1" /> Add Option
											</Button>
										</Label>
										{options.map((opt, i) => (
											<div key={i} className="flex items-center gap-2">
												<input
													type="radio"
													name="correct_option"
													checked={correctIndex === i}
													onChange={() => setCorrectIndex(i)}
													title="Mark as correct answer"
												/>
												<Input value={opt} onChange={(e) => {
													const newOpts = [...options];
													newOpts[i] = e.target.value;
													setOptions(newOpts);
												}} placeholder={`Option ${i + 1}`} />
												<Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => handleRemoveOption(i)}>
													<Icon name="IconTrash" className="w-4 h-4" />
												</Button>
											</div>
										))}
									</div>
									<div className="pt-4 flex justify-end">
										<Button onClick={handleSaveQuestion} disabled={createQuestion.isPending}>
											{createQuestion.isPending ? "Saving..." : "Save Question"}
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{quiz.questions?.map((q, idx) => (
								<div key={q.id} className="p-4 rounded-lg bg-muted/30 border">
									<div className="flex items-start justify-between">
										<div>
											<p className="font-medium text-sm mb-2">{idx + 1}. {q.question_text}</p>
											<div className="flex items-center gap-2 text-xs text-muted-foreground">
												<Badge variant="outline" className="text-[10px] uppercase font-bold">{q.question_type}</Badge>
												<span>{q.points} point(s)</span>
											</div>
										</div>
										<Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => setDeleteQId(q.id)}>
											<Icon name="IconTrash" className="w-4 h-4" />
										</Button>
									</div>
								</div>
							))}
							{(!quiz.questions || quiz.questions.length === 0) && (
								<p className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">No questions added yet.</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}
			<ConfirmDeleteDialog
				open={!!deleteQId}
				onOpenChange={(open) => !open && setDeleteQId(null)}
				onConfirm={handleDeleteQuestion}
				title="Delete Question"
				description="Are you sure you want to delete this question?"
				isLoading={deleteQuestion.isPending}
			/>
		</div>
	);
}
