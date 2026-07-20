"use client";

import React from "react";
import { Progress } from "@package/ui/progress";
import { Badge } from "@package/ui/badge";
import { Icon } from "@package/components/icon";
import type { StudyChapterItem } from "@package/schema/courses.types";

interface CourseSidebarProps {
	courseTitle?: string;
	completionPercent: number;
	completed: boolean;
	chapters: StudyChapterItem[];
	currentLessonId: string | null;
	toggleChapter: (chapterId: string) => void;
	expandedChapters: Record<string, boolean>;
	handleLessonClick: (lessonId: string) => void;
}

export function CourseSidebar({
	courseTitle,
	completionPercent,
	completed,
	chapters,
	currentLessonId,
	toggleChapter,
	expandedChapters,
	handleLessonClick,
}: CourseSidebarProps) {
	return (
		<aside className="w-full lg:w-80 shrink-0 border rounded-xl bg-card h-fit lg:sticky lg:top-4 overflow-hidden flex flex-col shadow-xs">
			<div className="p-4 border-b bg-muted/20">
				<h3 className="font-bold text-sm line-clamp-1">{courseTitle || "Course Content"}</h3>
				<div className="flex items-center justify-between mt-3 mb-2">
					<span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Progress</span>
					<Badge variant={completed ? "default" : "secondary"} className={`text-[10px] ${completed ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}>
						{completed ? "Completed" : `${completionPercent.toFixed(0)}% Done`}
					</Badge>
				</div>
				<Progress value={completionPercent} className="h-1.5" />
			</div>

			<div className="divide-y max-h-[60vh] lg:max-h-[calc(100vh-14rem)] overflow-y-auto">
				{chapters.map((chapter) => {
					const isExpanded = !!expandedChapters[chapter.id];
					return (
						<div key={chapter.id} className="flex flex-col">
							{/* Chapter Header */}
							<button
								onClick={() => toggleChapter(chapter.id)}
								className="flex items-start justify-between p-4 w-full text-left hover:bg-muted/30 transition-colors cursor-pointer border-none bg-transparent"
							>
								<div className="space-y-1 pr-2">
									<h4 className="text-xs font-bold text-foreground">
										Ch {chapter.chapter_no}: {chapter.title}
									</h4>
									<div className="text-[10px] text-muted-foreground font-mono">
										{chapter.progress.lessons_completed}/{chapter.total_lectures} lectures • {Math.floor(chapter.total_duration_seconds / 60)}m
									</div>
								</div>
								<Icon
									name={isExpanded ? "IconChevronUp" : "IconChevronDown"}
									className="w-4.5 h-4.5 text-muted-foreground shrink-0 mt-0.5"
								/>
							</button>

							{/* Chapter Lessons */}
							{isExpanded && (
								<div className="bg-muted/10 divide-y border-t">
									{chapter.lessons.map((lesson) => {
										const isActive = currentLessonId === lesson.id;
										return (
											<button
												key={lesson.id}
												onClick={() => handleLessonClick(lesson.id)}
												className={`flex items-start gap-3 p-3.5 w-full text-left transition-colors cursor-pointer border-none bg-transparent ${
													isActive ? "bg-primary/5 text-primary border-l-2 border-primary pl-[12px]" : "hover:bg-muted/40"
												}`}
											>
												<div className="shrink-0 mt-0.5">
													{lesson.completed ? (
														<Icon name="IconCircleCheck" className="w-4.5 h-4.5 text-green-500 fill-green-500/10" />
													) : (
														<Icon name="IconCircle" className="w-4.5 h-4.5 text-muted-foreground" />
													)}
												</div>
												<div className="min-w-0 flex-1">
													<div className={`text-xs font-medium leading-tight ${isActive ? "font-semibold text-primary" : "text-foreground"}`}>
														{lesson.title}
													</div>
													<div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground font-mono">
														{lesson.lesson_type === "video" && <Icon name="IconVideo" className="w-3 h-3" />}
														{lesson.lesson_type === "document" && <Icon name="IconFileText" className="w-3 h-3" />}
														{lesson.lesson_type === "quiz" && <Icon name="IconHelp" className="w-3 h-3" />}
														<span className="capitalize">{lesson.lesson_type}</span>
														<span>•</span>
														<span>
															{Math.floor(lesson.duration_seconds / 60)}:{String(lesson.duration_seconds % 60).padStart(2, "0")}
														</span>
													</div>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</aside>
	);
}
