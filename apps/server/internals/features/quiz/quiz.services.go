package quiz

import (
	"context"
	"errors"
	"strings"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

func (a *App) CreateMetadata(ctx context.Context, lessonID, tutorID string, req CreateQuizRequest) (*QuizMetadata, error) {
	qm, err := a.CreateMetadataRepository(ctx, lessonID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizLessonNotFound):
			return nil, utils.ErrNotFound("Lesson not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return nil, utils.ErrForbidden("Access denied. You do not own the course this lesson belongs to.", err)
		default:
			return nil, utils.ErrInternal("Failed to save quiz metadata.", err)
		}
	}

	a.Cache.Invalidate(ctx, "quiz:*")

	return qm, nil
}

func (a *App) ReadMetadata(ctx context.Context, lessonID, userID string, scope generic.AuthScope) (*QuizMetadata, error) {
	qm, err := a.ReadMetadataRepository(ctx, lessonID, userID, scope)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizLessonNotFound):
			return nil, utils.ErrNotFound("Lesson not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return nil, utils.ErrForbidden("Access denied. You do not own the course this lesson belongs to.", err)
		case errors.Is(err, generic.ErrQuizNotFound):
			return nil, utils.ErrNotFound("Quiz not found.", err)
		default:
			return nil, utils.ErrInternal("Failed to fetch quiz metadata.", err)
		}
	}
	return qm, nil
}

func (a *App) ListQuestions(ctx context.Context, quizID, userID string, scope generic.AuthScope) ([]QuizQuestionDetail, error) {
	questions, err := a.ListQuestionsRepository(ctx, quizID, userID, scope)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizNotFound):
			return nil, utils.ErrNotFound("Quiz not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return nil, utils.ErrForbidden("Access denied. You do not own the course this quiz belongs to.", err)
		default:
			return nil, utils.ErrInternal("Failed to fetch questions.", err)
		}
	}
	return questions, nil
}

func (a *App) CreateQuestion(ctx context.Context, quizID, tutorID string, req CreateQuestionRequest) (*QuizQuestion, error) {
	q, err := a.CreateQuestionRepository(ctx, quizID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizNotFound):
			return nil, utils.ErrNotFound("Quiz not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return nil, utils.ErrForbidden("Access denied. You do not own the course this quiz belongs to.", err)
		default:
			return nil, utils.ErrInternal("Failed to add question.", err)
		}
	}

	a.Cache.Invalidate(ctx, "quiz:*")

	return q, nil
}

func (a *App) UpdateQuestion(ctx context.Context, questionID, tutorID string, req CreateQuestionRequest) (*QuizQuestion, error) {
	q, err := a.UpdateQuestionRepository(ctx, questionID, tutorID, req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizQuestionNotFound):
			return nil, utils.ErrNotFound("Question not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return nil, utils.ErrForbidden("Access denied. You do not own the course this quiz belongs to.", err)
		default:
			return nil, utils.ErrInternal("Failed to update question.", err)
		}
	}

	a.Cache.Invalidate(ctx, "quiz:*")

	return q, nil
}

func (a *App) DeleteQuestion(ctx context.Context, id, tutorID string) (string, error) {
	deletedID, err := a.DeleteQuestionRepository(ctx, id, tutorID)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizQuestionNotFound):
			return "", utils.ErrNotFound("Question not found.", err)
		case errors.Is(err, generic.ErrQuizAccessDenied):
			return "", utils.ErrForbidden("Access denied. You do not own the course this question belongs to.", err)
		default:
			return "", utils.ErrInternal("Failed to delete question.", err)
		}
	}

	a.Cache.Invalidate(ctx, "quiz:*")

	return deletedID, nil
}

// GetQuestion is deliberately not cached: it picks a random not-yet-fetched
// question per call, so caching by (quiz, user, fetched_ids) doesn't cache a
// stable answer — it just risks serving a stale/empty result (e.g. a
// transient "no question" response) on every retry for the cache's TTL.
func (a *App) GetQuestion(ctx context.Context, quizID, userID string, req NextQuestionRequest) (*NextQuestionResponse, error) {
	resp, err := a.GetQuestionRepository(ctx, quizID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, generic.ErrQuizNotFound):
			return nil, utils.ErrNotFound("Quiz not found.", err)
		case errors.Is(err, generic.ErrQuizNotEnrolled):
			return nil, utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
		default:
			return nil, utils.ErrInternal("Failed to get question.", err)
		}
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
		switch {
		case errors.Is(err, generic.ErrQuizNotFound):
			return nil, utils.ErrNotFound("Quiz not found.", err)
		case errors.Is(err, generic.ErrQuizNotEnrolled):
			return nil, utils.ErrForbidden("Access denied. Not enrolled in this course.", err)
		default:
			return nil, utils.ErrInternal("Failed to submit quiz.", err)
		}
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

	// 2. Multi answers
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

	// 4. Fill answers
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
