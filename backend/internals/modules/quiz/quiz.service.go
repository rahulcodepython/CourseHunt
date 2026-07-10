package quiz

import (
	"database/sql"
	"strings"
)

func (m *QuizModule) CreateMetadataService(lessonID string, req CreateQuizRequest) (*QuizMetadata, error) {
	return m.CreateMetadataRepository(lessonID, req)
}

func (m *QuizModule) CreateQuestionService(quizID string, req CreateQuestionRequest) (*QuizQuestion, error) {
	return m.CreateQuestionRepository(quizID, req)
}

func (m *QuizModule) DeleteQuestionService(id string) (string, error) {
	return m.DeleteQuestionRepository(id)
}

func (m *QuizModule) GetQuestionService(quizID, userID string, req NextQuestionRequest) (*NextQuestionResponse, error) {
	q, opts, items, remaining, err := m.ReadNextQuestionUnified(quizID, req.FetchedQuestionIDs)
	if err != nil {
		return nil, err
	}

	resp := &NextQuestionResponse{
		RemainingQuestions: remaining,
	}

	if q != nil {
		qResp := &QuestionForAttempt{
			ID:            q.ID,
			QuestionType:  q.QuestionType,
			QuestionText:  q.QuestionText,
			Points:        q.Points,
			FillBlankHint: q.FillBlankHint,
			Options:       []QuizOptionPublic{},
			ArrangeItems:  []QuizArrangeItemPublic{},
		}
		for _, o := range opts {
			qResp.Options = append(qResp.Options, QuizOptionPublic{ID: o.ID, OptionText: o.OptionText})
		}
		for _, it := range items {
			qResp.ArrangeItems = append(qResp.ArrangeItems, QuizArrangeItemPublic{ID: it.ID, ItemText: it.ItemText})
		}
		resp.Question = qResp
	}
	return resp, nil
}

func (m *QuizModule) SubmitService(quizID, userID string, req SubmitQuizRequest) (*SubmitQuizResponse, error) {
	// 1. Read validation data (PassScore, Questions Map)
	passScore, dbQuestions, err := m.ReadQuizValidationRepository(quizID)
	if err != nil {
		return nil, err
	}

	qMap := make(map[string]QuestionValidation)
	for _, q := range dbQuestions {
		qMap[q.ID] = q
	}

	// 2. Begin transaction
	tx, err := m.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 3. Create attempt within transaction
	attempt, err := m.CreateAttemptRepository(tx, quizID, userID)
	if err != nil {
		return nil, err
	}

	var resp SubmitQuizResponse
	resp.AttemptID = attempt.ID

	totalPoints := 0
	earnedPoints := 0

	// Parallel slices to bulk insert answers
	var (
		insQuestionIDs    []string
		insSelectedOptIDs [][]string
		insArrangeOrders  [][]int64
		insFillTexts      []sql.NullString
		insSkippeds       []bool
		insCorrects       []bool
	)

	// 4. Validate answers (Business Logic)
	for _, ans := range req.Answers {
		isCorrect := false
		var fillText sql.NullString
		if ans.FillText != nil {
			fillText = sql.NullString{String: *ans.FillText, Valid: true}
		}

		if ans.IsSkipped {
			resp.SkippedCount++
		} else {
			q, exists := qMap[ans.QuestionID]
			if !exists {
				resp.IncorrectCount++
				continue
			}

			totalPoints += q.Points
			resultItem := QuizResultItem{QuestionID: ans.QuestionID}

			switch q.QuestionType {
			case "single_choice", "multi_choice":
				resultItem.CorrectOptionIDs = q.CorrectOptionIDs
				isCorrect = equalSets(q.CorrectOptionIDs, ans.SelectedOptionIDs)
			case "arrange":
				resultItem.CorrectArrangeOrder = q.CorrectArrangeOrder
				isCorrect = equalIntSlices(q.CorrectArrangeOrder, ans.ArrangeOrder)
			case "fill_blank":
				resultItem.CorrectFillAnswers = q.CorrectFillAnswers
				if ans.FillText != nil {
					for _, a := range q.CorrectFillAnswers {
						if strings.EqualFold(a, *ans.FillText) {
							isCorrect = true
							break
						}
					}
				}
			}

			if isCorrect {
				resp.CorrectCount++
				earnedPoints += q.Points
			} else {
				resp.IncorrectCount++
			}
			resultItem.IsCorrect = isCorrect
			resp.Results = append(resp.Results, resultItem)
		}

		// Map to batch arrays
		insQuestionIDs = append(insQuestionIDs, ans.QuestionID)
		insSelectedOptIDs = append(insSelectedOptIDs, ans.SelectedOptionIDs)

		var arrOrder64 []int64
		for _, v := range ans.ArrangeOrder {
			arrOrder64 = append(arrOrder64, int64(v))
		}
		insArrangeOrders = append(insArrangeOrders, arrOrder64)
		insFillTexts = append(insFillTexts, fillText)
		insSkippeds = append(insSkippeds, ans.IsSkipped)
		insCorrects = append(insCorrects, isCorrect)
	}

	// 5. Bulk insert attempt answers
	if err := m.SaveAttemptAnswersRepository(tx, attempt.ID, insQuestionIDs, insSelectedOptIDs, insArrangeOrders, insFillTexts, insSkippeds, insCorrects); err != nil {
		return nil, err
	}

	// 6. Calculate total score and passed metric
	if totalPoints > 0 {
		resp.TotalScore = float64(earnedPoints) / float64(totalPoints) * 100
	}
	resp.Passed = resp.TotalScore >= float64(passScore)

	// 7. Update attempt summary metrics
	if err := m.UpdateAttemptSummaryRepository(tx, attempt.ID, resp.TotalScore, resp.Passed, resp.CorrectCount, resp.IncorrectCount, resp.SkippedCount); err != nil {
		return nil, err
	}

	// 8. Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &resp, nil
}
