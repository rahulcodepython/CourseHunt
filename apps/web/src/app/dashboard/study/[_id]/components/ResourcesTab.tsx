"use client";

import React from "react";
import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { Icon } from "@package/components/icon";
import { useLessonResourcesQuery } from "@package/query-hooks/lessons.api";

interface ResourcesTabProps {
	lessonId: string;
}

export function ResourcesTab({ lessonId }: ResourcesTabProps) {
	const resourcesQuery = useLessonResourcesQuery(lessonId);
	const resources = resourcesQuery.data?.data ?? [];

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{resources.map((res) => (
				<Card key={res.id} className="border shadow-xs hover:border-primary/50 transition-colors">
					<CardContent className="p-4 flex items-center justify-between gap-4">
						<div className="min-w-0">
							<p className="text-xs font-semibold truncate text-foreground">{res.title}</p>
							<span className="text-[10px] text-muted-foreground uppercase font-mono">{res.file_type || "file"}</span>
						</div>
						<Button size="sm" variant="outline" className="h-8 shrink-0 text-xs cursor-pointer" asChild>
							<a href={res.file_url} target="_blank" rel="noreferrer" download className="flex items-center gap-1.5 no-underline">
								<Icon name="IconDownload" className="w-4.5 h-4.5" />
								Download
							</a>
						</Button>
					</CardContent>
				</Card>
			))}

			{resources.length === 0 && (
				<div className="col-span-full text-center py-10 text-xs text-muted-foreground">No resource files attached to this lesson.</div>
			)}
		</div>
	);
}
