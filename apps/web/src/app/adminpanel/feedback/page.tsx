"use client";

import { Icon } from "@/components/icon";
import { Badge } from "@package/ui/badge";
import { Card, CardContent, CardHeader } from "@package/ui/card";
import { useInspectFeedbacksQuery, useUpdateFeedbackMutation, useDeleteFeedbackMutation } from "@package/query-hooks/feedbacks.api";
import type { Feedback } from "@package/schema/feedbacks.types";
import { Button } from "@package/ui/button";
import Loading from "@/components/loading";

export default function FeedbackPage() {
	const { data: raw, isLoading } = useInspectFeedbacksQuery();
	const pinMutation = useUpdateFeedbackMutation();
	const deleteMutation = useDeleteFeedbackMutation();

	const paginatedData = raw?.data;
	const feedbacks: Feedback[] = paginatedData ? (paginatedData.data as unknown as Feedback[]) : [];

	const renderStars = (rating: number) => {
		return (
			<div className="flex items-center gap-1">
				{[...Array(5)].map((_, i) => (
					<Icon name="IconStar" key={i} className={`h-5 w-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
				))}
			</div>
		);
	};

	if (isLoading) return <Loading />;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold">Student Feedback</h1>
						<p className="text-muted-foreground mt-2">View all feedback and reviews from our students</p>
					</div>
				</div>

				{feedbacks.length === 0 ? (
					<div className="text-center text-gray-500 py-12">No feedback available yet.</div>
				) : (
					<div className="grid gap-6">
						{feedbacks.map((feedback: Feedback) => (
							<Card key={feedback.id} className="hover:shadow-md transition-shadow">
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="space-y-2">
											<div className="flex items-center gap-3">
												<div className="flex items-center gap-2">
													<Icon name="IconUser" className="h-5 w-5 text-muted-foreground" />
													<span className="font-semibold">{feedback.user?.name || "Unknown"}</span>
												</div>
												<Badge variant="secondary" className="font-mono">{feedback.rating}/5</Badge>
											</div>
											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													<Icon name="IconMail" className="h-5 w-5" />
													{feedback.user?.image || ""}
												</div>
												<div className="flex items-center gap-1">
													<Icon name="IconCalendar" className="h-5 w-5" />
													{new Date(feedback.created_at).toLocaleDateString()}
												</div>
											</div>
											<Badge variant="outline">{feedback.course?.title || "Unknown"}</Badge>
										</div>
										<div className="flex flex-col items-end gap-3">
											{renderStars(feedback.rating)}
											<div className="flex items-center gap-2">
												<Button
													variant="ghost"
													size="sm"
													className={feedback.is_pinned ? "text-primary bg-primary/10" : "text-muted-foreground"}
													onClick={() => pinMutation.execute({ id: feedback.id, data: { is_pinned: !feedback.is_pinned } })}
													disabled={pinMutation.isPending}
												>
													{feedback.is_pinned ? <Icon name="IconPinFilled" className="w-5 h-5 mr-1" /> : <Icon name="IconPin" className="w-5 h-5 mr-1" />}
													{feedback.is_pinned ? "Unpin" : "Pin"}
												</Button>
												<Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.execute(feedback.id)} disabled={deleteMutation.isPending}>
													<Icon name="IconTrash" className="w-5 h-5" />
												</Button>
											</div>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground leading-relaxed">{feedback.content}</p>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
