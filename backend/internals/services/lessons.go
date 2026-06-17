package services

import (
	"database/sql"
	"fmt"

	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type LessonService struct {
	Lessons     *repositories.LessonRepository
	Enrollments *repositories.EnrollmentRepository
	Notes       *repositories.NoteRepository
	Quiz        *repositories.QuizRepository
}

func NewLessonService() *LessonService {
	return &LessonService{
		Lessons:     repositories.NewLessonRepository(),
		Enrollments: repositories.NewEnrollmentRepository(),
		Notes:       repositories.NewNoteRepository(),
		Quiz:        repositories.NewQuizRepository(),
	}
}

func (s *LessonService) List(chapterID string) ([]models.Lesson, error) {
	return s.Lessons.ListByChapter(chapterID)
}

func (s *LessonService) Create(chapterID string, req models.CreateLessonRequest) (*models.Lesson, error) {
	return s.Lessons.Create(chapterID, req)
}

func (s *LessonService) Update(id string, req models.UpdateLessonRequest) (*models.Lesson, error) {
	return s.Lessons.Update(id, req)
}

func (s *LessonService) Delete(id string) error { return s.Lessons.Delete(id) }

func (s *LessonService) UpsertVideoContent(lessonID string, req models.UpsertVideoContentRequest) (*models.LessonVideoContent, error) {
	return s.Lessons.UpsertVideoContent(lessonID, req)
}

func (s *LessonService) UpsertDocumentContent(lessonID, content string) (*models.LessonDocumentContent, error) {
	return s.Lessons.UpsertDocumentContent(lessonID, content)
}

func (s *LessonService) AddResource(lessonID string, req models.AddResourceRequest) (*models.LessonResource, error) {
	return s.Lessons.AddResource(lessonID, req)
}

func (s *LessonService) ListResources(lessonID string) ([]models.LessonResource, error) {
	return s.Lessons.ListResources(lessonID)
}

func (s *LessonService) DeleteResource(id string) error {
	return s.Lessons.DeleteResource(id)
}

// Content returns the full lesson content for study, validating enrollment.
func (s *LessonService) Content(lessonID, userID, courseID string) (*models.LessonContentResponse, error) {
	lesson, err := s.Lessons.FindByID(lessonID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("lesson not found")
	}
	if err != nil {
		return nil, err
	}

	// Validate enrollment (unless admin/tutor — handled at handler level via permission)
	if !s.Enrollments.IsEnrolled(userID, courseID) {
		return nil, fmt.Errorf("not enrolled")
	}

	resp := &models.LessonContentResponse{}
	resp.Lesson.ID = lesson.ID
	resp.Lesson.Title = lesson.Title
	resp.Lesson.LessonType = lesson.LessonType
	resp.Lesson.LessonNo = lesson.LessonNo
	resp.Lesson.ChapterID = lesson.ChapterID

	switch lesson.LessonType {
	case "video":
		vc, _ := s.Lessons.GetVideoContent(lessonID)
		if vc != nil {
			resp.Content.VideoURL = &vc.VideoURL
			resp.Content.WrittenContent = vc.WrittenContent
		}
	case "document":
		dc, _ := s.Lessons.GetDocumentContent(lessonID)
		if dc != nil {
			resp.Content.DocumentContent = &dc.Content
		}
	case "quiz":
		qm, _ := s.Quiz.GetMetadataByLesson(lessonID)
		if qm != nil {
			resp.Content.QuizMetadata = qm
		}
	}

	resp.Resources, _ = s.Lessons.ListResources(lessonID)
	if resp.Resources == nil {
		resp.Resources = []models.LessonResource{}
	}

	note, _ := s.Notes.Get(userID, lessonID)
	if note != nil {
		resp.UserNote.Content = &note.Content
	}

	resp.Completed = s.Enrollments.GetLessonProgress(userID, lessonID)

	// Update last accessed
	s.Enrollments.UpdateLastAccessed(userID, courseID, lessonID)

	return resp, nil
}

func (s *LessonService) MarkComplete(userID, lessonID, courseID string) error {
	return s.Enrollments.MarkLessonComplete(userID, lessonID, courseID)
}

func (s *LessonService) GetChapterID(lessonID string) (string, error) {
	return s.Lessons.GetChapterIDByLesson(lessonID)
}
