package quiz

func (m *QuizModule) CreateMetadataService(lessonID string, req CreateQuizRequest) (*QuizMetadata, error) {
	return m.CreateMetadataRepository(lessonID, req)
}

func (m *QuizModule) CreateQuestionService(quizID string, req CreateQuestionRequest) (*QuizQuestion, error) {
	return m.CreateQuestionRepository(quizID, req)
}

func (m *QuizModule) DeleteQuestionService(id string) (string, error) { return m.DeleteQuestionRepository(id) }

func (m *QuizModule) CreateAttemptService(quizID, userID string) (*QuizAttempt, error) {
	return m.CreateAttemptRepository(quizID, userID)
}

func (m *QuizModule) NextQuestionService(lessonID, userID string, req NextQuestionRequest) (*NextQuestionResponse, error) {
	qm, err := m.ReadMetadataRepository(lessonID)
	if err != nil {
		return nil, err
	}

	attempt, err := m.ReadAttemptRepository(req.AttemptID, userID)
	if err != nil {
		return nil, err
	}

	q, opts, items, err := m.ReadNextQuestionRepository(qm.ID, req.FetchedQuestionIDs)
	if err != nil {
		return nil, err
	}

	remaining := m.RemainingCountRepository(qm.ID, req.FetchedQuestionIDs)

	resp := &NextQuestionResponse{
		AttemptID:            attempt.ID,
		RemainingQuestions:   remaining,
		TimeRemainingSeconds: qm.TimeLimitSeconds,
	}

	if q != nil {
		qResp := &QuestionForAttempt{
			ID:            q.ID,
			QuestionType:  q.QuestionType,
			QuestionText:  q.QuestionText,
			Points:        q.Points,
			FillBlankHint: q.FillBlankHint,
		}
		for _, o := range opts {
			qResp.Options = append(qResp.Options, QuizOptionPublic{ID: o.ID, OptionText: o.OptionText})
		}
		for _, it := range items {
			qResp.ArrangeItems = append(qResp.ArrangeItems, QuizArrangeItemPublic{ID: it.ID, ItemText: it.ItemText})
		}
		if qResp.Options == nil {
			qResp.Options = []QuizOptionPublic{}
		}
		if qResp.ArrangeItems == nil {
			qResp.ArrangeItems = []QuizArrangeItemPublic{}
		}
		resp.Question = qResp
	}
	return resp, nil
}

func (m *QuizModule) SubmitService(lessonID, userID string, req SubmitQuizRequest) (*SubmitQuizResponse, error) {
	attempt, err := m.ReadAttemptRepository(req.AttemptID, userID)
	if err != nil {
		return nil, err
	}
	return m.SubmitAttemptRepository(attempt, req)
}
