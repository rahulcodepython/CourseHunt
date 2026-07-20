"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@package/ui/button";
import { Textarea } from "@package/ui/textarea";
import { Icon } from "@package/components/icon";
import { useNotesQuery, useCreateNoteMutation } from "@package/query-hooks/notes.api";
import { toast } from "sonner";

interface NotesTabProps {
	lessonId: string;
}

export function NotesTab({ lessonId }: NotesTabProps) {
	const notesQuery = useNotesQuery(lessonId);
	const createNoteMutation = useCreateNoteMutation(lessonId);

	const [noteContent, setNoteContent] = useState("");
	const [notesTabMode, setNotesTabMode] = useState<"edit" | "preview">("edit");

	useEffect(() => {
		if (notesQuery.data?.data) {
			setNoteContent(notesQuery.data.data.content);
		} else {
			setNoteContent("");
		}
	}, [notesQuery.data, lessonId]);

	const handleSaveNote = async () => {
		const res = await createNoteMutation.execute({ content: noteContent });
		if (res) {
			toast.success("Note saved successfully");
		}
	};

	const parseMarkdown = (text: string): string => {
		if (!text) return "";
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold my-2 text-foreground">$1</h3>')
			.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold my-3 text-foreground">$1</h2>')
			.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold my-4 text-foreground">$1</h1>')
			.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
			.replace(/\*(.*)\*/gim, '<em>$1</em>')
			.replace(/`([^`]+)`/gim, '<code class="bg-muted px-1 rounded text-xs font-mono">$1</code>')
			.replace(/\n/g, '<br />');
	};

	return (
		<div className="bg-card border rounded-lg p-4 space-y-4 shadow-xs">
			<div className="flex justify-between items-center border-b pb-3">
				<div className="flex border rounded-md overflow-hidden">
					<button
						onClick={() => setNotesTabMode("edit")}
						className={`px-3 py-1.5 text-[10px] font-bold border-none cursor-pointer ${
							notesTabMode === "edit" ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
						}`}
					>
						Write Markdown
					</button>
					<button
						onClick={() => setNotesTabMode("preview")}
						className={`px-3 py-1.5 text-[10px] font-bold border-none cursor-pointer ${
							notesTabMode === "preview" ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
						}`}
					>
						Preview
					</button>
				</div>
				<Button size="sm" onClick={handleSaveNote} className="text-white bg-primary h-8 cursor-pointer">
					<Icon name="IconDeviceFloppy" className="w-4 h-4 mr-1.5" /> Save Note
				</Button>
			</div>

			{notesTabMode === "edit" ? (
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
