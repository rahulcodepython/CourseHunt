"use client";

import { Input } from "@package/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@package/ui/select";
import { Icon } from "@package/components/icon";

interface CoursesToolbarProps {
	search: string;
	onSearchChange: (value: string) => void;
	status: string;
	onStatusChange: (value: string) => void;
	level: string;
	onLevelChange: (value: string) => void;
}

export function CoursesToolbar({ search, onSearchChange, status, onStatusChange, level, onLevelChange }: CoursesToolbarProps) {
	return (
		<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
			<div className="relative w-full max-w-xs flex-1">
				<Icon name="IconSearch" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search courses..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-10"
				/>
			</div>
			<div className="flex items-center gap-3">
				<Select value={status} onValueChange={(v) => onStatusChange(v || "all")}>
					<SelectTrigger className="w-[140px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="draft">Draft</SelectItem>
						<SelectItem value="published">Published</SelectItem>
						<SelectItem value="archived">Archived</SelectItem>
					</SelectContent>
				</Select>
				<Select value={level} onValueChange={(v) => onLevelChange(v || "all")}>
					<SelectTrigger className="w-[140px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Levels</SelectItem>
						<SelectItem value="beginner">Beginner</SelectItem>
						<SelectItem value="intermediate">Intermediate</SelectItem>
						<SelectItem value="advanced">Advanced</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
