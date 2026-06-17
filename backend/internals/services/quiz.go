package services

import (
	"coursehunt-backend/internals/models"
	"coursehunt-backend/internals/repositories"
)

type QuizService struct{ Repo *repositories.QuizRepository }

func NewQuizService() *QuizService { return &QuizService{Repo: repositories.NewQuizRepository()} }

func (s *QuizService) CreateMetadata(lessonID string, req models.CreateQuizRequest) (*models.QuizMetadata, error) {
	return s.Repo.CreateMetadata(lessonID, req)
}

func (s *QuizService) AddQuestion(quizID string, req models.CreateQuestionRequest) (*models.QuizQuestion, error) {
	return s.Repo.AddQuestion(quizID, req)
}

func (s *QuizService) DeleteQuestion(id string) error { return s.Repo.DeleteQuestion(id) }

func (s *QuizService) StartAttempt(quizID, userID string) (*models.QuizAttempt, error) {
	return s.Repo.StartAttempt(quizID, userID)
}

func (s *QuizService) NextQuestion(lessonID, userID string, req models.NextQuestionRequest) (*models.NextQuestionResponse, error) {
	qm, err := s.Repo.GetMetadataByLesson(lessonID)
	if err != nil {
		return nil, err
	}

	attempt, err := s.Repo.GetAttempt(req.AttemptID, userID)
	if err != nil {
		return nil, err
	}

	q, opts, items, err := s.Repo.GetNextQuestion(qm.ID, req.FetchedQuestionIDs)
	if err != nil {
		return nil, err
	}

	remaining := s.Repo.RemainingCount(qm.ID, req.FetchedQuestionIDs)

	resp := &models.NextQuestionResponse{
		AttemptID:            attempt.ID,
		RemainingQuestions:   remaining,
		TimeRemainingSeconds: qm.TimeLimitSeconds,
	}

	if q != nil {
		qResp := &models.QuestionForAttempt{
			ID:            q.ID,
			QuestionType:  q.QuestionType,
			QuestionText:  q.QuestionText,
			Points:        q.Points,
			FillBlankHint: q.FillBlankHint,
		}
		for _, o := range opts {
			qResp.Options = append(qResp.Options, models.QuizOptionPublic{ID: o.ID, OptionText: o.OptionText})
		}
		for _, it := range items {
			qResp.ArrangeItems = append(qResp.ArrangeItems, models.QuizArrangeItemPublic{ID: it.ID, ItemText: it.ItemText})
		}
		if qResp.Options == nil {
			qResp.Options = []models.QuizOptionPublic{}
		}
		if qResp.ArrangeItems == nil {
			qResp.ArrangeItems = []models.QuizArrangeItemPublic{}
		}
		resp.Question = qResp
	}
	return resp, nil
}

func (s *QuizService) Submit(lessonID, userID string, req models.SubmitQuizRequest) (*models.SubmitQuizResponse, error) {
	attempt, err := s.Repo.GetAttempt(req.AttemptID, userID)
	if err != nil {
		return nil, err
	}
	return s.Repo.SubmitAttempt(attempt, req)
}
