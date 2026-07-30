package services

import (
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/helpers"
	"coursehunt/server/internals/repositories"

	"github.com/jmoiron/sqlx"
)

type QuizService struct {
	DB              *sqlx.DB
	Repo            *repositories.QuizRepository
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

	var answersToSave repositories.QuizAnswersToSave
	var correctCount, incorrectCount, skippedCount int
	results := make([]entities.QuizResultItem, 0)

	// 1. Single answers
	for _, ans := range req.SingleAnswers {
		q, ok := quiz.Questions[ans.QuestionID]
		if !ok {
			continue
		}
		isCorrect := false
		if !ans.IsSkipped && len(q.CorrectOptionIDs) > 0 {
			isCorrect = ans.SelectedOptionID == q.CorrectOptionIDs[0]
		}

		if ans.IsSkipped {
			skippedCount++
		} else if isCorrect {
			correctCount++
		} else {
			incorrectCount++
		}

		answersToSave.SingleAnswers = append(answersToSave.SingleAnswers, entities.QuizAttemptSingleAnswer{
			QuestionID:       ans.QuestionID,
			SelectedOptionID: ans.SelectedOptionID,
			IsCorrect:        isCorrect,
			IsSkipped:        ans.IsSkipped,
		})

		results = append(results, entities.QuizResultItem{
			QuestionID:       ans.QuestionID,
			IsCorrect:        !ans.IsSkipped && isCorrect,
			CorrectOptionIDs: q.CorrectOptionIDs,
		})
	}

	// 2. Multi answers
	for _, ans := range req.MultiAnswers {
		q, ok := quiz.Questions[ans.QuestionID]
		if !ok {
			continue
		}
		isCorrect := false
		if !ans.IsSkipped {
			isCorrect = helpers.EqualSets(ans.SelectedOptionIDs, q.CorrectOptionIDs)
		}

		if ans.IsSkipped {
			skippedCount++
		} else if isCorrect {
			correctCount++
		} else {
			incorrectCount++
		}

		answersToSave.MultiAnswers = append(answersToSave.MultiAnswers, struct {
			Answer            entities.QuizAttemptMultiAnswer
			SelectedOptionIDs []string
		}{
			Answer: entities.QuizAttemptMultiAnswer{
				QuestionID: ans.QuestionID,
				IsCorrect:  isCorrect,
				IsSkipped:  ans.IsSkipped,
			},
			SelectedOptionIDs: ans.SelectedOptionIDs,
		})

		results = append(results, entities.QuizResultItem{
			QuestionID:       ans.QuestionID,
			IsCorrect:        !ans.IsSkipped && isCorrect,
			CorrectOptionIDs: q.CorrectOptionIDs,
		})
	}

	// 3. Arrange answers
	for _, ans := range req.ArrangeAnswers {
		q, ok := quiz.Questions[ans.QuestionID]
		if !ok {
			continue
		}

		submittedOrders := make([]int, len(ans.Items))
		for i, item := range ans.Items {
			submittedOrders[i] = item.Order
		}

		isCorrect := false
		if !ans.IsSkipped {
			isCorrect = helpers.EqualIntSlices(submittedOrders, q.CorrectArrangeOrder)
		}

		if ans.IsSkipped {
			skippedCount++
		} else if isCorrect {
			correctCount++
		} else {
			incorrectCount++
		}

		for _, item := range ans.Items {
			answersToSave.ArrangeAnswers = append(answersToSave.ArrangeAnswers, entities.QuizAttemptArrangeAnswer{
				QuestionID:     ans.QuestionID,
				ArrangeItemID:  item.ItemID,
				SubmittedOrder: item.Order,
				IsCorrect:      isCorrect,
				IsSkipped:      ans.IsSkipped,
			})
		}

		results = append(results, entities.QuizResultItem{
			QuestionID:          ans.QuestionID,
			IsCorrect:           !ans.IsSkipped && isCorrect,
			CorrectArrangeOrder: q.CorrectArrangeOrder,
		})
	}

	// 4. Fill answers
	for _, ans := range req.FillAnswers {
		q, ok := quiz.Questions[ans.QuestionID]
		if !ok {
			continue
		}

		isCorrect := false
		if !ans.IsSkipped {
			for _, correct := range q.CorrectFillAnswers {
				if ans.FillText == correct {
					isCorrect = true
					break
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

		answersToSave.FillAnswers = append(answersToSave.FillAnswers, entities.QuizAttemptFillAnswer{
			QuestionID: ans.QuestionID,
			FillText:   ans.FillText,
			IsCorrect:  isCorrect,
			IsSkipped:  ans.IsSkipped,
		})

		results = append(results, entities.QuizResultItem{
			QuestionID:         ans.QuestionID,
			IsCorrect:          !ans.IsSkipped && isCorrect,
			CorrectFillAnswers: q.CorrectFillAnswers,
		})
	}

	totalQuestions := len(quiz.Questions)
	totalScore := 0.0
	if totalQuestions > 0 {
		totalScore = float64(correctCount) / float64(totalQuestions) * 100
	}
	passed := totalScore >= float64(quiz.PassScorePercent)

	attemptID, err := s.Repo.SaveQuizAttemptRepository(quizID, userID, totalScore, passed, correctCount, incorrectCount, skippedCount, answersToSave)
	if err != nil {
		return nil, err
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
