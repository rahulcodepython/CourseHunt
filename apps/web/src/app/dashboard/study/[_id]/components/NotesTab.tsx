"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@package/ui/button";
import { Textarea } from "@package/ui/textarea";
import { Icon } from "@package/components/icon";
import { useNotesQuery, useCreateNoteMutation } from "@package/query-hooks/notes.api";
import { toast } from "sonner";
import { NoteModeToggle } from "./NoteModeToggle";
import { parseMarkdown } from "./markdown";

interface NotesTabProps {
	lessonId: string;
}

export function NotesTab({ lessonId }: NotesTabProps) {
	const notesQuery = useNotesQuery(lessonId);
	const createNoteMutation = useCreateNoteMutation(lessonId);

	const [noteContent, setNoteContent] = useState("");
	const [mode, setMode] = useState<"edit" | "preview">("edit");

	useEffect(() => {
		setNoteContent(notesQuery.data?.data?.content ?? "");
	}, [notesQuery.data, lessonId]);

	const handleSaveNote = async () => {
		const res = await createNoteMutation.execute({ content: noteContent });
		if (res) {
			toast.success("Note saved successfully");
		}
	};

	return (
		<div className="bg-card border rounded-lg p-4 space-y-4 shadow-xs">
			<div className="flex justify-between items-center border-b pb-3">
				<NoteModeToggle mode={mode} onChange={setMode} />
				<Button size="sm" onClick={handleSaveNote} className="text-white bg-primary h-8 cursor-pointer">
					<Icon name="IconDeviceFloppy" className="w-4 h-4 mr-1.5" /> Save Note
				</Button>
			</div>

			{mode === "edit" ? (
				<Textarea
					placeholder="Keep your markdown formatted notes here..."
					value={noteContent}
					onChange={(e) => setNoteContent(e.target.value)}
					className="min-h-[220px] bg-muted/20 text-xs font-mono"
				/>
			) : (
				<div
					className="prose dark:prose-invert max-w-none text-xs leading-relaxed p-4 bg-muted/10 border rounded-lg min-h-[220px]"
					dangerouslySetInnerHTML={{ __html: parseMarkdown(noteContent) }}
				/>
			)}
		</div>
	);
}
