"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Input } from "@package/ui/input";
import { Label } from "@package/ui/label";
import { Textarea } from "@package/ui/textarea";
import { useState } from "react";

export function FaqStep({ course, courseId }: { course: any; courseId: string; onNext: () => void }) {
    const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(course.faqs || []);

    return (
        <div className="space-y-6">
            {faqs.map((faq, i) => (
                <div key={i} className="space-y-2 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                        <Label>Question {i + 1}</Label>
                        <Button variant="ghost" size="sm" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}>
                            <Icon name="IconTrash" className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    <Input value={faq.question} onChange={(e) => {
                        const next = [...faqs]; next[i].question = e.target.value; setFaqs(next);
                    }} placeholder="Question" />
                    <Textarea value={faq.answer} onChange={(e) => {
                        const next = [...faqs]; next[i].answer = e.target.value; setFaqs(next);
                    }} placeholder="Answer" rows={3} />
                </div>
            ))}
            <Button variant="outline" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>
                <Icon name="IconPlus" className="mr-1 h-3 w-3" /> Add FAQ
            </Button>
        </div>
    );
}
