package quiz

import (
	"strings"
)

func (m *QuizModule) SubmitQuizService(quizID, userID string, req SubmitQuizRequest) (*SubmitQuizResponse, error) {
	// 1. Get quiz evaluation data from repo
	evalData, err := m.GetQuizForEvaluationRepository(quizID, userID)
	if err != nil {
		return nil, err
	}

	// 2. Evaluate answers
	var resp SubmitQuizResponse
	
	totalPoints := 0
	earnedPoints := 0

	var answersToSave []AttemptAnswerToSave

	for _, ans := range req.Answers {
		isCorrect := false
		var fillText *string
		if ans.FillText != nil {
			fillText = ans.FillText
		}

		if ans.IsSkipped {
			resp.SkippedCount++
		} else {
			q, exists := evalData.Questions[ans.QuestionID]
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

		// Prepare save payload
		answersToSave = append(answersToSave, AttemptAnswerToSave{
			QuestionID:        ans.QuestionID,
			SelectedOptionIDs: ans.SelectedOptionIDs,
			ArrangeOrder:      ans.ArrangeOrder,
			FillText:          fillText,
			IsSkipped:         ans.IsSkipped,
			IsCorrect:         isCorrect,
		})
	}

	if totalPoints > 0 {
		resp.TotalScore = float64(earnedPoints) / float64(totalPoints) * 100
	}
	resp.Passed = resp.TotalScore >= float64(evalData.PassScorePercent)

	// 3. Save attempt and answers in one query
	attemptID, err := m.SaveQuizAttemptRepository(quizID, userID, resp.TotalScore, resp.Passed, resp.CorrectCount, resp.IncorrectCount, resp.SkippedCount, answersToSave)
	if err != nil {
		return nil, err
	}

	resp.AttemptID = attemptID

	return &resp, nil
}
