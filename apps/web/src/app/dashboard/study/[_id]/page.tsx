"use client";

import { Icon } from "@package/components/icon";
import { Card, CardContent } from "@package/ui/card";
import { useLessonContentQuery, useCompleteLessonMutation } from "@package/query-hooks/lessons.api";
import { useParams, useSearchParams } from "next/navigation";
import Loading from "@package/components/loading";
import { toast } from "sonner";
import { useState } from "react";
import { LessonContentPlayer } from "@/app/dashboard/study/[_id]/components/LessonContentPlayer";
import { DiscussionsTab } from "@/app/dashboard/study/[_id]/components/DiscussionsTab";
import { ResourcesTab } from "@/app/dashboard/study/[_id]/components/ResourcesTab";
import { NotesTab } from "@/app/dashboard/study/[_id]/components/NotesTab";
import { FeedbackTab } from "@/app/dashboard/study/[_id]/components/FeedbackTab";
import { TabsNav, type TabItem } from "@/app/dashboard/study/[_id]/components/TabsNav";

type TabId = "discussion" | "resources" | "notes" | "feedback";

const TABS: TabItem[] = [
	{ id: "discussion", name: "Discussions", icon: "IconMessage2" },
	{ id: "resources", name: "Resources", icon: "IconFolder" },
	{ id: "notes", name: "Notes", icon: "IconNotebook" },
	{ id: "feedback", name: "Feedback", icon: "IconStar" },
];

export default function StudyPage() {
	const { _id } = useParams();
	const searchParams = useSearchParams();
	const lessonId = searchParams.get("lessonId");

	const [activeTab, setActiveTab] = useState<TabId>("discussion");

	const lessonContentQuery = useLessonContentQuery(lessonId || "");
	const completeLessonMutation = useCompleteLessonMutation(_id as string);

	if (!lessonId) {
		return (
			<Card className="border-none shadow-sm flex items-center justify-center min-h-[300px]">
				<CardContent className="text-center space-y-2 pt-6">
					<Icon name="IconBook" className="w-12 h-12 text-muted-foreground/40 mx-auto" />
					<h3 className="font-bold text-lg">No Lesson Selected</h3>
					<p className="text-xs text-muted-foreground">Select a chapter and lesson from the sidebar index to begin learning</p>
				</CardContent>
			</Card>
		);
	}

	if (lessonContentQuery.isLoading) return <Loading />;
	if (!lessonContentQuery.data?.data) {
		return <div className="text-center py-20 text-muted-foreground">Lesson details could not be loaded.</div>;
	}

	const content = lessonContentQuery.data.data;

	const handleComplete = async () => {
		const result = await completeLessonMutation.execute(lessonId);
		if (result) {
			toast.success("Lesson completed!");
		}
	};

	return (
		<div className="space-y-6">
			<LessonContentPlayer content={content} handleComplete={handleComplete} />

			<TabsNav tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

			<div className="pt-2">
				{activeTab === "discussion" && <DiscussionsTab lessonId={lessonId} />}
				{activeTab === "resources" && <ResourcesTab lessonId={lessonId} />}
				{activeTab === "notes" && <NotesTab lessonId={lessonId} />}
				{activeTab === "feedback" && <FeedbackTab courseId={_id as string} />}
			</div>
		</div>
	);
}
