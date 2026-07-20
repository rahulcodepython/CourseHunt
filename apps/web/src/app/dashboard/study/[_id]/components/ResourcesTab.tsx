"use client";

import React from "react";
import { useLessonResourcesQuery } from "@package/query-hooks/lessons.api";
import { ResourceCard } from "./ResourceCard";

interface ResourcesTabProps {
	lessonId: string;
}

export function ResourcesTab({ lessonId }: ResourcesTabProps) {
	const resourcesQuery = useLessonResourcesQuery(lessonId);
	const resources = resourcesQuery.data?.data ?? [];

	if (resources.length === 0) {
		return <div className="text-center py-10 text-xs text-muted-foreground">No resource files attached to this lesson.</div>;
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{resources.map((res) => (
				<ResourceCard key={res.id} title={res.title} fileType={res.file_type} fileUrl={res.file_url} />
			))}
		</div>
	);
}
