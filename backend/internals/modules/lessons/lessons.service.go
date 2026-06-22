package lessons

import (
	"database/sql"
	"fmt"
)

func (m *LessonsModule) ListService(chapterID string) ([]Lesson, error) {
	return m.ListRepository(chapterID)
}

func (m *LessonsModule) CreateService(chapterID string, req CreateLessonRequest) (*Lesson, error) {
	return m.CreateRepository(chapterID, req)
}

func (m *LessonsModule) UpdateService(id string, req UpdateLessonRequest) (*Lesson, error) {
	return m.UpdateRepository(id, req)
}

func (m *LessonsModule) DeleteService(id string) error { return m.DeleteRepository(id) }

func (m *LessonsModule) UpsertVideoContentService(lessonID string, req UpsertVideoContentRequest) (*LessonVideoContent, error) {
	return m.UpsertVideoContentRepository(lessonID, req)
}

func (m *LessonsModule) UpsertDocumentContentService(lessonID, content string) (*LessonDocumentContent, error) {
	return m.UpsertDocumentContentRepository(lessonID, content)
}

func (m *LessonsModule) CreateResourceService(lessonID string, req AddResourceRequest) (*LessonResource, error) {
	return m.CreateResourceRepository(lessonID, req)
}

func (m *LessonsModule) ListResourcesService(lessonID string) ([]LessonResource, error) {
	return m.ListResourcesRepository(lessonID)
}

func (m *LessonsModule) DeleteResourceService(id string) error {
	return m.DeleteResourceRepository(id)
}

// Content returns the full lesson content for study, validating enrollment.
func (m *LessonsModule) ReadContentService(lessonID, userID, courseID string) (*LessonContentResponse, error) {
	lesson, err := m.ReadRepository(lessonID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("lesson not found")
	}
	if err != nil {
		return nil, err
	}

	// Validate enrollment (unless admin/tutor — handled at handler level via permission)
	if !m.Enrollments.IsEnrolledRepository(userID, courseID) {
		return nil, fmt.Errorf("not enrolled")
	}

	resp := &LessonContentResponse{}
	resp.Lesson.ID = lesson.ID
	resp.Lesson.Title = lesson.Title
	resp.Lesson.LessonType = lesson.LessonType
	resp.Lesson.LessonNo = lesson.LessonNo
	resp.Lesson.ChapterID = lesson.ChapterID

	switch lesson.LessonType {
	case "video":
		vc, _ := m.ReadVideoContentRepository(lessonID)
		if vc != nil {
			resp.Content.VideoURL = &vc.VideoURL
			resp.Content.WrittenContent = vc.WrittenContent
		}
	case "document":
		dc, _ := m.ReadDocumentContentRepository(lessonID)
		if dc != nil {
			resp.Content.DocumentContent = &dc.Content
		}
	case "quiz":
		qm, _ := m.Quiz.ReadMetadataRepository(lessonID)
		if qm != nil {
			resp.Content.QuizMetadata = qm
		}
	}

	resp.Resources, _ = m.ListResourcesRepository(lessonID)
	if resp.Resources == nil {
		resp.Resources = []LessonResource{}
	}

	note, _ := m.Notes.ReadRepository(userID, lessonID)
	if note != nil {
		resp.UserNote.Content = &note.Content
	}

	resp.Completed = m.Enrollments.GetLessonProgressRepository(userID, lessonID)

	// Update last accessed
	m.Enrollments.UpdateLastAccessedRepository(userID, courseID, lessonID)

	return resp, nil
}

func (m *LessonsModule) UpdateCompleteService(userID, lessonID, courseID string) error {
	return m.Enrollments.MarkLessonCompleteRepository(userID, lessonID, courseID)
}

func (m *LessonsModule) GetChapterIDService(lessonID string) (string, error) {
	return m.GetChapterIDByLesson(lessonID)
}
