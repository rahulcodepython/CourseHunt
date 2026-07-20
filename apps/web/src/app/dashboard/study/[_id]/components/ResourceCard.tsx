"use client";

import { Button } from "@package/ui/button";
import { Card, CardContent } from "@package/ui/card";
import { Icon } from "@package/components/icon";

interface ResourceCardProps {
	title: string;
	fileType?: string | null;
	fileUrl: string;
}

export function ResourceCard({ title, fileType, fileUrl }: ResourceCardProps) {
	return (
		<Card className="border shadow-xs hover:border-primary/50 transition-colors">
			<CardContent className="p-4 flex items-center justify-between gap-4">
				<div className="min-w-0">
					<p className="text-xs font-semibold truncate text-foreground">{title}</p>
					<span className="text-[10px] text-muted-foreground uppercase font-mono">{fileType || "file"}</span>
				</div>
				<Button size="sm" variant="outline" className="h-8 shrink-0 text-xs cursor-pointer" asChild>
					<a href={fileUrl} target="_blank" rel="noreferrer" download className="flex items-center gap-1.5 no-underline">
						<Icon name="IconDownload" className="w-4.5 h-4.5" />
						Download
					</a>
				</Button>
			</CardContent>
		</Card>
	);
}
