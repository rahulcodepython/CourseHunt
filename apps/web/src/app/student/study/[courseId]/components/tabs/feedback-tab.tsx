"use client";

import * as React from "react";

import { useCreateFeedbackMutation } from "@/query-hooks/feedbacks.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
    const [hovered, setHovered] = React.useState(0);

    return (
        <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onClick={() => onChange(star)}
                    aria-label={`Rate ${star} star`}
                >
                    <Icon
                        name="star"
                        className={cn(
                            "size-6 transition-colors",
                            star <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
                        )}
                    />
                </button>
            ))}
        </div>
    );
}

export function FeedbackTab({ courseId }: { courseId: string }) {
    const [rating, setRating] = React.useState(0);
    const [content, setContent] = React.useState("");
    const createFeedback = useCreateFeedbackMutation();

    const submit = async () => {
        if (!rating) return;
        const res = await createFeedback.execute({ course_id: courseId, rating, content: content || null });
        if (res?.success) {
            setRating(0);
            setContent("");
        }
    };

    return (
        <div className="flex flex-col gap-4 justify-center w-full py-6">
            <div className="space-y-1.5">
                <p className="text-sm font-medium">Your Rating</p>
                <StarRating value={rating} onChange={setRating} />
            </div>
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts about this course..."
                className="min-h-32 resize-none"
            />
            <div className="flex justify-end">
                <Button disabled={!rating || createFeedback.isPending} onClick={submit}>
                    Submit Review
                </Button>
            </div>
        </div>
    );
}
