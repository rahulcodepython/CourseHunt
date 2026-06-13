package repositories

import (
	"database/sql"

	"coursehunt-backend/internals/database"
	"coursehunt-backend/internals/models"
)

type DiscussionRepository struct {
	DB *sql.DB
}

func NewDiscussionRepository() *DiscussionRepository {
	return &DiscussionRepository{DB: database.DB}
}

func (r *DiscussionRepository) ListByLesson(lessonID int) ([]models.Discussion, error) {
	rows, err := r.DB.Query(`
		SELECT d.id, d.lesson_id, d.user_id, COALESCE(u.name, 'Unknown'), COALESCE(u.image, ''), COALESCE(u.role, 'student'), d.message, d.parent_id, d.created_at
		FROM discussions d
		LEFT JOIN "user" u ON d.user_id = u.id
		WHERE d.lesson_id = $1
		ORDER BY d.created_at ASC
	`, lessonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var discussions []models.Discussion
	for rows.Next() {
		var d models.Discussion
		if err := rows.Scan(&d.ID, &d.LessonID, &d.UserID, &d.UserName, &d.UserImage, &d.Role, &d.Message, &d.ParentID, &d.CreatedAt); err != nil {
			return nil, err
		}
		discussions = append(discussions, d)
	}

	// build tree
	var topLevel []models.Discussion
	replyMap := make(map[int][]models.Discussion)

	for _, d := range discussions {
		if d.ParentID != nil {
			replyMap[*d.ParentID] = append(replyMap[*d.ParentID], d)
		} else {
			topLevel = append(topLevel, d)
		}
	}

	for i := range topLevel {
		topLevel[i].Replies = replyMap[topLevel[i].ID]
	}

	return topLevel, nil
}

func (r *DiscussionRepository) Create(lessonID int, userID string, message string, parentID *int) (*models.Discussion, error) {
	var id int
	err := r.DB.QueryRow(`
		INSERT INTO discussions(lesson_id, user_id, message, parent_id)
		VALUES($1, $2, $3, $4)
		RETURNING id
	`, lessonID, userID, message, parentID).Scan(&id)
	if err != nil {
		return nil, err
	}

	var d models.Discussion
	err = r.DB.QueryRow(`
		SELECT d.id, d.lesson_id, d.user_id, COALESCE(u.name, 'Unknown'), COALESCE(u.image, ''), COALESCE(u.role, 'student'), d.message, d.parent_id, d.created_at
		FROM discussions d
		LEFT JOIN "user" u ON d.user_id = u.id
		WHERE d.id = $1
	`, id).Scan(&d.ID, &d.LessonID, &d.UserID, &d.UserName, &d.UserImage, &d.Role, &d.Message, &d.ParentID, &d.CreatedAt)
	
	return &d, err
}

func (r *DiscussionRepository) Delete(id int) error {
	_, err := r.DB.Exec(`DELETE FROM discussions WHERE id = $1`, id)
	return err
}
