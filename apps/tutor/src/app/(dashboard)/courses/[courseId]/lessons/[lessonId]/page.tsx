"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Input } from "@package/ui/input";
import { Textarea } from "@package/ui/textarea";
import { Label } from "@package/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@package/ui/tabs";
import { useLessonContentQuery, useAddVideoMutation, useAddDocumentMutation } from "@package/query-hooks/lessons.api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function LessonEditorPage() {
    const params = useParams();
    const lessonId = params.lessonId as string;

    const { data: contentRaw, isLoading } = useLessonContentQuery(lessonId);
    const addVideo = useAddVideoMutation(lessonId);
    const addDocument = useAddDocumentMutation(lessonId);

    const content = contentRaw?.data;

    const [videoUrl, setVideoUrl] = useState("");
    const [writtenContent, setWrittenContent] = useState("");
    const [docContent, setDocContent] = useState("");

    useEffect(() => {
        if (content) {
            if (content.video_content) {
                setVideoUrl(content.video_content.video_url || "");
                setWrittenContent(content.video_content.written_content || "");
            }
            if (content.document_content) {
                setDocContent(content.document_content.content || "");
            }
        }
    }, [content]);

    const handleSaveVideo = async () => {
        if (!videoUrl.trim()) return toast.error("Video URL is required");
        const res = await addVideo.execute({ video_url: videoUrl, written_content: writtenContent || null });
        if (res) toast.success("Video content saved");
    };

    const handleSaveDocument = async () => {
        if (!docContent.trim()) return toast.error("Document content is required");
        const res = await addDocument.execute({ content: docContent });
        if (res) toast.success("Document content saved");
    };

    if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold">Edit Lesson Content</h1>
                <p className="text-muted-foreground text-sm">Manage video, document, and resource content</p>
            </div>

            <Tabs defaultValue={content?.lesson_type === "document" ? "document" : "video"}>
                <TabsList>
                    <TabsTrigger value="video">
                        <Icon name="IconVideo" className="w-4 h-4 mr-1" /> Video
                    </TabsTrigger>
                    <TabsTrigger value="document">
                        <Icon name="IconFile" className="w-4 h-4 mr-1" /> Document
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="video" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle>Video Content</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Video URL</Label>
                                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://example.com/video.mp4" />
                            </div>
                            <div className="space-y-2">
                                <Label>Written Content (optional)</Label>
                                <Textarea value={writtenContent} onChange={(e) => setWrittenContent(e.target.value)} className="min-h-[200px]" placeholder="Supplementary written material..." />
                            </div>
                            <Button onClick={handleSaveVideo}>
                                <Icon name="IconDeviceFloppy" className="w-4 h-4 mr-1" /> Save Video
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="document" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle>Document Content</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Content</Label>
                                <Textarea value={docContent} onChange={(e) => setDocContent(e.target.value)} className="min-h-[400px]" placeholder="Write your lesson content here..." />
                            </div>
                            <Button onClick={handleSaveDocument}>
                                <Icon name="IconDeviceFloppy" className="w-4 h-4 mr-1" /> Save Document
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
