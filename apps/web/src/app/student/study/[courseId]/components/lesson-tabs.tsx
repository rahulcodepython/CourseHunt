"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LESSON_TYPE } from "@/lib/const";
import { ContentTab } from "./tabs/content-tab";
import { FeedbackTab } from "./tabs/feedback-tab";
import { DiscussionsTab } from "./tabs/discussions-tab";
import { NotesTab } from "./tabs/notes-tab";
import { ResourcesTab } from "./tabs/resources-tab";
import { AttemptsTab } from "./tabs/attempts-tab";

export function LessonTabs({
  courseId,
  lessonId,
  lessonType,
  writtenContent,
  quizId,
}: {
  courseId: string;
  lessonId: string;
  lessonType: string;
  writtenContent?: string | null;
  quizId?: string | null;
}) {
  const isVideo = lessonType === LESSON_TYPE.VIDEO;
  const isQuiz = lessonType === LESSON_TYPE.QUIZ;

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue={isVideo ? "content" : isQuiz && quizId ? "attempts" : "feedback"}>
          <TabsList>
            {isVideo && <TabsTrigger value="content">Content</TabsTrigger>}
            {isQuiz && quizId && <TabsTrigger value="attempts">Attempts</TabsTrigger>}
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {isVideo && (
            <TabsContent value="content" className="pt-4">
              <ContentTab content={writtenContent} />
            </TabsContent>
          )}
          {isQuiz && quizId && (
            <TabsContent value="attempts" className="pt-4">
              <AttemptsTab quizId={quizId} />
            </TabsContent>
          )}
          <TabsContent value="feedback" className="pt-4">
            <FeedbackTab courseId={courseId} />
          </TabsContent>
          <TabsContent value="discussions" className="pt-4">
            <DiscussionsTab lessonId={lessonId} />
          </TabsContent>
          <TabsContent value="notes" className="pt-4">
            <NotesTab lessonId={lessonId} />
          </TabsContent>
          <TabsContent value="resources" className="pt-4">
            <ResourcesTab lessonId={lessonId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
