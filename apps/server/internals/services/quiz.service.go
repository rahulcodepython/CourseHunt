package services

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/helpers"
	"coursehunt/server/internals/repositories"

	"github.com/jmoiron/sqlx"
)

type QuizService struct {
	DB    *sqlx.DB
	Repo  *repositories.QuizRepository
	EnrollmentsRepo *repositories.EnrollmentsRepository
	CoursesRepo     *repositories.CoursesRepository
}

func NewQuizService(db *sqlx.DB, repo *repositories.QuizRepository, enrollmentsRepo *repositories.EnrollmentsRepository, coursesRepo *repositories.CoursesRepository) *QuizService {
	return &QuizService{DB: db, Repo: repo, EnrollmentsRepo: enrollmentsRepo, CoursesRepo: coursesRepo}
}

func (s *QuizService) SubmitQuizService(quizID, userID string, req entities.SubmitQuizRequest) (*entities.SubmitQuizResponse, error) {
	quiz, err := s.Repo.GetQuizForEvaluationRepository(quizID, userID)
	if err != nil {
		return nil, generic.ErrQuizNotFound
	}

	answers := make([]entities.AttemptAnswerToSave, 0, len(req.Answers))
	var correctCount, incorrectCount, skippedCount int

	for _, ans := range req.Answers {
		q, ok := quiz.Questions[ans.QuestionID]
		if !ok {
			continue
		}

		isCorrect := false
		switch q.QuestionType {
		case "single_choice":
			if len(ans.SelectedOptionIDs) == 1 {
				isCorrect = helpers.EqualSets(ans.SelectedOptionIDs, q.CorrectOptionIDs)
			}
		case "multi_choice":
			isCorrect = helpers.EqualSets(ans.SelectedOptionIDs, q.CorrectOptionIDs)
		case "arrange":
			isCorrect = helpers.EqualIntSlices(ans.ArrangeOrder, q.CorrectArrangeOrder)
		case "fill_blank":
			if ans.FillText != nil {
				for _, correct := range q.CorrectFillAnswers {
					if *ans.FillText == correct {
						isCorrect = true
						break
					}
				}
			}
		}

		if ans.IsSkipped {
			skippedCount++
		} else if isCorrect {
			correctCount++
		} else {
			incorrectCount++
		}

		answers = append(answers, entities.AttemptAnswerToSave{
			QuestionID:        ans.QuestionID,
			SelectedOptionIDs: ans.SelectedOptionIDs,
			ArrangeOrder:      ans.ArrangeOrder,
			FillText:          ans.FillText,
			IsSkipped:         ans.IsSkipped,
			IsCorrect:         isCorrect,
		})
	}

	totalQuestions := len(quiz.Questions)
	totalScore := 0.0
	if totalQuestions > 0 {
		totalScore = float64(correctCount) / float64(totalQuestions) * 100
	}
	passed := totalScore >= float64(quiz.PassScorePercent)

	attemptID, err := s.Repo.SaveQuizAttemptRepository(quizID, userID, totalScore, passed, correctCount, incorrectCount, skippedCount, answers)
	if err != nil {
		return nil, err
	}

	results := make([]entities.QuizResultItem, 0, len(req.Answers))
	for _, ans := range req.Answers {
		if q, ok := quiz.Questions[ans.QuestionID]; ok {
			isCorrect := false
			switch q.QuestionType {
			case "single_choice":
				isCorrect = len(ans.SelectedOptionIDs) == 1 && ans.SelectedOptionIDs[0] == q.CorrectOptionIDs[0]
			case "multi_choice":
				isCorrect = helpers.EqualSets(ans.SelectedOptionIDs, q.CorrectOptionIDs)
			case "arrange":
				isCorrect = helpers.EqualIntSlices(ans.ArrangeOrder, q.CorrectArrangeOrder)
			case "fill_blank":
				if ans.FillText != nil {
					for _, correct := range q.CorrectFillAnswers {
						if *ans.FillText == correct {
							isCorrect = true
							break
						}
					}
				}
			}
			results = append(results, entities.QuizResultItem{
				QuestionID:          ans.QuestionID,
				IsCorrect:           !ans.IsSkipped && isCorrect,
				CorrectOptionIDs:    q.CorrectOptionIDs,
				CorrectArrangeOrder: q.CorrectArrangeOrder,
				CorrectFillAnswers:  q.CorrectFillAnswers,
			})
		}
	}

	return &entities.SubmitQuizResponse{
		AttemptID:      attemptID,
		TotalScore:     totalScore,
		CorrectCount:   correctCount,
		IncorrectCount: incorrectCount,
		SkippedCount:   skippedCount,
		Passed:         passed,
		Results:        results,
	}, nil
}
