"use client";

import * as React from "react";

import { useNotesQuery, useCreateNoteMutation, useDeleteNoteMutation } from "@/query-hooks/notes.api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { MarkdownContent } from "@/components/markdown-content";

export function NotesTab({ lessonId }: { lessonId: string }) {
    const { data: raw, isLoading } = useNotesQuery(lessonId);
    const saveNote = useCreateNoteMutation(lessonId);
    const deleteNote = useDeleteNoteMutation(lessonId);

    const [content, setContent] = React.useState("");
    const [previewing, setPreviewing] = React.useState(false);
    const hydratedRef = React.useRef(false);

    React.useEffect(() => {
        if (hydratedRef.current || !raw?.data) return;
        hydratedRef.current = true;
        setContent(raw.data.content ?? "");
    }, [raw]);

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading notes...</p>;
    }

    const noteId = raw?.data?.id;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Your Notes</p>
                <div className="flex gap-2">
                    {noteId && (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={deleteNote.isPending}
                            onClick={async () => {
                                const res = await deleteNote.execute(noteId);
                                if (res?.success) {
                                    setContent("");
                                    hydratedRef.current = false;
                                }
                            }}
                        >
                            <Icon name="trash" className="size-3.5" />
                            Delete
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setPreviewing((v) => !v)}>
                        <Icon name={previewing ? "pencil" : "eye"} className="size-3.5" />
                        {previewing ? "Write" : "Preview"}
                    </Button>
                    <Button size="sm" disabled={saveNote.isPending} onClick={() => saveNote.execute({ content })}>
                        <Icon name="check" className="size-3.5" />
                        Save
                    </Button>
                </div>
            </div>

            {previewing ? (
                content.trim() ? (
                    <div className="min-h-64 rounded-md border p-4">
                        <MarkdownContent content={content} />
                    </div>
                ) : (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Nothing to preview yet.</p>
                )
            ) : (
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your notes for this lesson in Markdown..."
                    className="min-h-64 font-mono text-sm"
                />
            )}
        </div>
    );
}
