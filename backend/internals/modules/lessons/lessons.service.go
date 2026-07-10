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

func (m *LessonsModule) DeleteService(id string) (string, error) { return m.DeleteRepository(id) }

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

func (m *LessonsModule) DeleteResourceService(id string) (string, error) {
	return m.DeleteResourceRepository(id)
}

// Content returns the full lesson content for study, validating enrollment.
func (m *LessonsModule) ReadContentService(lessonID, userID, courseID string) (interface{}, error) {
	resp, err := m.ReadContentAggregatedRepository(lessonID, userID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("lesson not found")
	}
	if err != nil {
		return nil, err
	}

	// Update last accessed
	m.UpdateLastAccessed(userID, courseID, lessonID)

	return resp, nil
}

func (m *LessonsModule) UpdateCompleteService(userID, lessonID, courseID string) error {
	return m.MarkLessonComplete(userID, lessonID, courseID)
}
