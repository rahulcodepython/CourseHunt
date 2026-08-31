package quiz

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/utils"
)

func (a *App) CreateMetadata(ctx context.Context, lessonID, userID string, req CreateQuizRequest) (*QuizMetadata, error) {
	qm, err := a.CreateMetadataRepository(ctx, lessonID, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrQuizLessonNotFound) {
			return nil, utils.ErrNotFound("Lesson not found.", err)
		}
		if errors.Is(err, generic.ErrQuizAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
		}
		return nil, utils.ErrInternal("Failed to save quiz metadata.", err)
	}

	a.Cache.Invalidate(ctx, "quiz:*", "lessons:*")

	return qm, nil
}

func (a *App) AdminReadMetadata(ctx context.Context, lessonID string) (*QuizMetadata, error) {
	cacheKey := fmt.Sprintf("quiz:admin:meta:%s", lessonID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() (*QuizMetadata, error) {
		qm, err := a.AdminReadMetadataRepository(ctx, lessonID)
		if err != nil {
			if errors.Is(err, generic.ErrQuizLessonNotFound) {
				return nil, utils.ErrNotFound("Lesson not found.", err)
			}
			if errors.Is(err, generic.ErrQuizNotFound) {
				return nil, utils.ErrNotFound("Quiz not found.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch quiz metadata.", err)
		}
		return qm, nil
	})
}

func (a *App) TutorReadMetadata(ctx context.Context, lessonID, userID string) (*QuizMetadata, error) {
	cacheKey := fmt.Sprintf("quiz:tutor:meta:%s:u:%s", lessonID, userID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() (*QuizMetadata, error) {
		qm, err := a.TutorReadMetadataRepository(ctx, lessonID, userID)
		if err != nil {
			if errors.Is(err, generic.ErrQuizLessonNotFound) {
				return nil, utils.ErrNotFound("Lesson not found.", err)
			}
			if errors.Is(err, generic.ErrQuizAccessDenied) {
				return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
			}
			if errors.Is(err, generic.ErrQuizNotFound) {
				return nil, utils.ErrNotFound("Quiz not found.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch quiz metadata.", err)
		}
		return qm, nil
	})
}

func (a *App) AdminListQuestions(ctx context.Context, quizID string) ([]QuizQuestionDetail, error) {
	cacheKey := fmt.Sprintf("quiz:admin:questions:%s", quizID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]QuizQuestionDetail, error) {
		questions, err := a.AdminListQuestionsRepository(ctx, quizID)
		if err != nil {
			if errors.Is(err, generic.ErrQuizNotFound) {
				return nil, utils.ErrNotFound("Quiz not found.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch questions.", err)
		}
		return questions, nil
	})
}

func (a *App) TutorListQuestions(ctx context.Context, quizID, userID string) ([]QuizQuestionDetail, error) {
	cacheKey := fmt.Sprintf("quiz:tutor:questions:%s:u:%s", quizID, userID)

	return cache.Fetch(ctx, a.Cache, cacheKey, 10*time.Minute, func() ([]QuizQuestionDetail, error) {
		questions, err := a.TutorListQuestionsRepository(ctx, quizID, userID)
		if err != nil {
			if errors.Is(err, generic.ErrQuizNotFound) {
				return nil, utils.ErrNotFound("Quiz not found.", err)
			}
			if errors.Is(err, generic.ErrQuizAccessDenied) {
				return nil, utils.ErrForbidden("Access denied. You do not own this course.", err)
			}
			return nil, utils.ErrInternal("Failed to fetch questions.", err)
		}
		return questions, nil
	})
}

func (a *App) CreateQuestion(ctx context.Context, quizID, tutorID string, req CreateQuestionRequest) (*QuizQuestion, error) {
	q, err := a.CreateQuestionRepository(ctx, quizID, tutorID, req)
	if err != nil {
		if errors.Is(err, generic.ErrQuizNotFound) {
			return nil, utils.ErrNotFound("Quiz not found.", err)
		}
		if errors.Is(err, generic.ErrQuizAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own the course this quiz belongs to.", err)
		}
		return nil, utils.ErrInternal("Failed to create question.", err)
	}

	a.Cache.Invalidate(ctx, "quiz:*")

	return q, nil
}

func (a *App) UpdateQuestion(ctx context.Context, id, tutorID string, req CreateQuestionRequest) (*QuizQuestion, error) {
	q, err := a.UpdateQuestionRepository(ctx, id, tutorID, req)
	if err != nil {
		if errors.Is(err, generic.ErrQuizQuestionNotFound) {
			return nil, utils.ErrNotFound("Question not found.", err)
		}
		if errors.Is(err, generic.ErrQuizAccessDenied) {
			return nil, utils.ErrForbidden("Access denied. You do not own the course this quiz belongs to.", err)
		}
		return nil, utils.ErrInternal("Failed to update question.", err)
	}

	a.Cache.Invalidate(ctx, "quiz:*")

	return q, nil
}

func (a *App) DeleteQuestion(ctx context.Context, id, tutorID string) (string, error) {
	deletedID, err := a.DeleteQuestionRepository(ctx, id, tutorID)
	if err != nil {
		if errors.Is(err, generic.ErrQuizQuestionNotFound) {
			return "", utils.ErrNotFound("Question not found.", err)
		}
		if errors.Is(err, generic.ErrQuizAccessDenied) {
			return "", utils.ErrForbidden("Access denied. You do not own the course this question belongs to.", err)
		}
		return "", utils.ErrInternal("Failed to delete question.", err)
	}

	a.Cache.Invalidate(ctx, "quiz:*")

	return deletedID, nil
}

func (a *App) GetQuestion(ctx context.Context, quizID, userID string, req NextQuestionRequest) (*NextQuestionResponse, error) {
	resp, err := a.GetQuestionRepository(ctx, quizID, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrQuizNotFound) {
			return nil, utils.ErrNotFound("Quiz not found.", err)
		}
		if errors.Is(err, generic.ErrQuizNotEnrolled) {
			return nil, utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
		}
		return nil, utils.ErrInternal("Failed to get question.", err)
	}
	return resp, nil
}

func (a *App) ListAttempts(ctx context.Context, quizID, userID string) ([]QuizAttemptSummary, error) {
	attempts, err := a.ListAttemptsRepository(ctx, quizID, userID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch quiz attempts.", err)
	}
	return attempts, nil
}

func (a *App) GetAttemptDetail(ctx context.Context, attemptID, userID string) (*QuizAttemptDetail, error) {
	detail, err := a.GetAttemptDetailRepository(ctx, attemptID, userID)
	if err != nil {
		if errors.Is(err, generic.ErrQuizAttemptNotFound) {
			return nil, utils.ErrNotFound("Quiz attempt not found.", err)
		}
		return nil, utils.ErrInternal("Failed to fetch quiz attempt.", err)
	}
	return detail, nil
}

func (a *App) Submit(ctx context.Context, quizID, userID string, req SubmitQuizRequest) (*SubmitQuizResponse, error) {
	resp, err := a.submit(ctx, quizID, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrQuizNotFound) {
			return nil, utils.ErrNotFound("Quiz not found.", err)
		}
		if errors.Is(err, generic.ErrQuizNotEnrolled) {
			return nil, utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
		}
		return nil, utils.ErrInternal("Failed to submit quiz.", err)
	}

	a.Cache.Invalidate(ctx, "quiz:*")

	return resp, nil
}

func (a *App) submit(ctx context.Context, quizID, userID string, req SubmitQuizRequest) (*SubmitQuizResponse, error) {
	quiz, err := a.GetQuizForEvaluationRepository(ctx, quizID, userID)
	if err != nil {
		if errors.Is(err, generic.ErrQuizNotEnrolled) {
			return nil, generic.ErrQuizNotEnrolled
		}
		return nil, generic.ErrQuizNotFound
	}

	var answersToSave QuizAnswersToSave
	var correctCount, incorrectCount, skippedCount int
	results := make([]QuizResultItem, 0)

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

		answersToSave.SingleAnswers = append(answersToSave.SingleAnswers, QuizAttemptSingleAnswer{
			QuestionID:       ans.QuestionID,
			SelectedOptionID: ans.SelectedOptionID,
			IsCorrect:        isCorrect,
			IsSkipped:        ans.IsSkipped,
		})

		results = append(results, QuizResultItem{
			QuestionID:       ans.QuestionID,
			IsCorrect:        !ans.IsSkipped && isCorrect,
			CorrectOptionIDs: q.CorrectOptionIDs,
		})
	}

	for _, ans := range req.MultiAnswers {
		q, ok := quiz.Questions[ans.QuestionID]
		if !ok {
			continue
		}
		isCorrect := false
		if !ans.IsSkipped {
			isCorrect = equalSets(ans.SelectedOptionIDs, q.CorrectOptionIDs)
		}

		if ans.IsSkipped {
			skippedCount++
		} else if isCorrect {
			correctCount++
		} else {
			incorrectCount++
		}

		answersToSave.MultiAnswers = append(answersToSave.MultiAnswers, struct {
			Answer            QuizAttemptMultiAnswer
			SelectedOptionIDs []string
		}{
			Answer: QuizAttemptMultiAnswer{
				QuestionID: ans.QuestionID,
				IsCorrect:  isCorrect,
				IsSkipped:  ans.IsSkipped,
			},
			SelectedOptionIDs: ans.SelectedOptionIDs,
		})

		results = append(results, QuizResultItem{
			QuestionID:       ans.QuestionID,
			IsCorrect:        !ans.IsSkipped && isCorrect,
			CorrectOptionIDs: q.CorrectOptionIDs,
		})
	}

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
			isCorrect = equalIntSlices(submittedOrders, q.CorrectArrangeOrder)
		}

		if ans.IsSkipped {
			skippedCount++
		} else if isCorrect {
			correctCount++
		} else {
			incorrectCount++
		}

		for _, item := range ans.Items {
			answersToSave.ArrangeAnswers = append(answersToSave.ArrangeAnswers, QuizAttemptArrangeAnswer{
				QuestionID:     ans.QuestionID,
				ArrangeItemID:  item.ItemID,
				SubmittedOrder: item.Order,
				IsCorrect:      isCorrect,
				IsSkipped:      ans.IsSkipped,
			})
		}

		results = append(results, QuizResultItem{
			QuestionID:          ans.QuestionID,
			IsCorrect:           !ans.IsSkipped && isCorrect,
			CorrectArrangeOrder: q.CorrectArrangeOrder,
		})
	}

	for _, ans := range req.FillAnswers {
		q, ok := quiz.Questions[ans.QuestionID]
		if !ok {
			continue
		}

		isCorrect := false
		if !ans.IsSkipped {
			submitted := strings.TrimSpace(strings.ToLower(ans.FillText))
			for _, correct := range q.CorrectFillAnswers {
				if submitted == strings.TrimSpace(strings.ToLower(correct)) {
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

		answersToSave.FillAnswers = append(answersToSave.FillAnswers, QuizAttemptFillAnswer{
			QuestionID: ans.QuestionID,
			FillText:   ans.FillText,
			IsCorrect:  isCorrect,
			IsSkipped:  ans.IsSkipped,
		})

		results = append(results, QuizResultItem{
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

	attemptID, err := a.SaveQuizAttemptRepository(ctx, quizID, userID, totalScore, passed, correctCount, incorrectCount, skippedCount, answersToSave)
	if err != nil {
		return nil, err
	}

	return &SubmitQuizResponse{
		AttemptID:      attemptID,
		TotalScore:     totalScore,
		CorrectCount:   correctCount,
		IncorrectCount: incorrectCount,
		SkippedCount:   skippedCount,
		Passed:         passed,
		Results:        results,
	}, nil
}
