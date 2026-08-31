package quiz

import (
	"context"
	"encoding/json"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

func (a *App) ReadNextQuestionUnifiedRepository(ctx context.Context, quizID, userID string, fetchedIDs []string) (*QuizQuestion, []QuizOption, []QuizArrangeItem, int, error) {
	exclude := ""
	args := []any{quizID, userID}
	countParam := "$3"
	if len(fetchedIDs) > 0 {
		exclude = " AND qq.id != ALL($3)"
		args = append(args, fetchedIDs)
		countParam = "$4"
	}
	args = append(args, len(fetchedIDs))

	query := BuildNextQuestionQuery(exclude, countParam)

	var (
		quizExists     bool
		isEnrolled     bool
		remainingCount int
		questionJSON   []byte
	)

	err := a.DB.QueryRow(ctx, query, args...).Scan(&quizExists, &isEnrolled, &remainingCount, &questionJSON)
	if err != nil {
		return nil, nil, nil, 0, postgres.MapPgError(err)
	}

	switch {
	case !quizExists:
		return nil, nil, nil, 0, generic.ErrQuizNotFound
	case !isEnrolled:
		return nil, nil, nil, 0, generic.ErrQuizNotEnrolled
	case len(questionJSON) == 0 || string(questionJSON) == "null":
		return nil, nil, nil, remainingCount, nil
	}

	var parser struct {
		Question     QuizQuestion      `json:"question"`
		Options      []QuizOption      `json:"options"`
		ArrangeItems []QuizArrangeItem `json:"arrange_items"`
	}
	if err := json.Unmarshal(questionJSON, &parser); err != nil {
		return nil, nil, nil, 0, err
	}
	return &parser.Question, parser.Options, parser.ArrangeItems, remainingCount, nil
}

func deconflictArrangeOrder(items []QuizArrangeItem) []QuizArrangeItem {
	if len(items) < 2 {
		return items
	}
	alreadySorted := true
	for i := 1; i < len(items); i++ {
		if items[i-1].CorrectOrder > items[i].CorrectOrder {
			alreadySorted = false
			break
		}
	}
	if alreadySorted {
		items[0], items[1] = items[1], items[0]
	}
	return items
}

func (a *App) GetQuestionRepository(ctx context.Context, quizID, userID string, req NextQuestionRequest) (*NextQuestionResponse, error) {
	q, opts, items, remaining, err := a.ReadNextQuestionUnifiedRepository(ctx, quizID, userID, req.FetchedQuestionIDs)
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
		for _, it := range deconflictArrangeOrder(items) {
			qResp.ArrangeItems = append(qResp.ArrangeItems, QuizArrangeItemPublic{ID: it.ID, ItemText: it.ItemText})
		}
		resp.Question = qResp
	}
	return resp, nil
}

func (a *App) GetQuizForEvaluationRepository(ctx context.Context, quizID, userID string) (*QuizEvaluationData, error) {
	var (
		quizExists       bool
		isEnrolled       bool
		passScorePercent int
		questionsJSON    []byte
	)

	err := a.DB.QueryRow(ctx, GetQuizEvaluation, quizID, userID).Scan(
		&quizExists, &isEnrolled, &passScorePercent, &questionsJSON,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !quizExists, Err: generic.ErrQuizNotFound},
		postgres.Condition{Failed: !isEnrolled, Err: generic.ErrQuizNotEnrolled},
	); err != nil {
		return nil, err
	}

	dbQuestions, err := postgres.DecodeJSONSlice[QuestionValidation](questionsJSON)
	if err != nil {
		return nil, err
	}

	qMap := make(map[string]QuestionValidation)
	for _, q := range dbQuestions {
		qMap[q.ID] = q
	}

	return &QuizEvaluationData{
		PassScorePercent: passScorePercent,
		Questions:        qMap,
	}, nil
}

func (a *App) ListAttemptsRepository(ctx context.Context, quizID, userID string) ([]QuizAttemptSummary, error) {
	return postgres.QueryJSONSlice[QuizAttemptSummary](ctx, a.DB, ListAttempts, quizID, userID)
}

func (a *App) GetAttemptDetailRepository(ctx context.Context, attemptID, userID string) (*QuizAttemptDetail, error) {
	var (
		attemptExists bool
		quizTitle     string
		totalScore    float64
		passed        bool
		questionsJSON []byte
	)

	err := a.DB.QueryRow(ctx, GetAttemptDetail, attemptID, userID).Scan(
		&attemptExists, &quizTitle, &totalScore, &passed, &questionsJSON,
	)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	if !attemptExists {
		return nil, generic.ErrQuizAttemptNotFound
	}

	questions, err := postgres.DecodeJSONSlice[QuizAttemptQuestionBreakdown](questionsJSON)
	if err != nil {
		return nil, err
	}

	return &QuizAttemptDetail{
		AttemptID:  attemptID,
		QuizTitle:  quizTitle,
		TotalScore: totalScore,
		Passed:     passed,
		Questions:  questions,
	}, nil
}

type QuizAnswersToSave struct {
	SingleAnswers []QuizAttemptSingleAnswer
	MultiAnswers  []struct {
		Answer            QuizAttemptMultiAnswer
		SelectedOptionIDs []string
	}
	ArrangeAnswers []QuizAttemptArrangeAnswer
	FillAnswers    []QuizAttemptFillAnswer
}

// multiAnswerInput is the shape of one element of the jsonb array passed to
// SaveQuizAttempt for multi-select answers — see that query's comment for
// why multi-answers batch via JSON instead of parallel-array UNNEST like
// every other answer type.
type multiAnswerInput struct {
	QuestionID string   `json:"question_id"`
	IsCorrect  bool     `json:"is_correct"`
	IsSkipped  bool     `json:"is_skipped"`
	OptionIDs  []string `json:"option_ids"`
}

// SaveQuizAttemptRepository persists a full quiz submission in one round
// trip via the SaveQuizAttempt query — see that query's comment for the
// batching strategy per answer type.
func (a *App) SaveQuizAttemptRepository(ctx context.Context, quizID, userID string, score float64, passed bool, correctCount, incorrectCount, skippedCount int, answers QuizAnswersToSave) (string, error) {
	var singleQIDs, singleOptIDs []string
	var singleCorrects, singleSkips []bool
	for _, sa := range answers.SingleAnswers {
		singleQIDs = append(singleQIDs, sa.QuestionID)
		singleOptIDs = append(singleOptIDs, sa.SelectedOptionID)
		singleCorrects = append(singleCorrects, sa.IsCorrect)
		singleSkips = append(singleSkips, sa.IsSkipped)
	}

	multiInputs := make([]multiAnswerInput, 0, len(answers.MultiAnswers))
	for _, ma := range answers.MultiAnswers {
		multiInputs = append(multiInputs, multiAnswerInput{
			QuestionID: ma.Answer.QuestionID,
			IsCorrect:  ma.Answer.IsCorrect,
			IsSkipped:  ma.Answer.IsSkipped,
			OptionIDs:  ma.SelectedOptionIDs,
		})
	}
	multiJSON, err := json.Marshal(multiInputs)
	if err != nil {
		return "", err
	}

	var arrangeQIDs, arrangeItemIDs []string
	var arrangeOrders []int
	var arrangeCorrects, arrangeSkips []bool
	for _, aa := range answers.ArrangeAnswers {
		arrangeQIDs = append(arrangeQIDs, aa.QuestionID)
		arrangeItemIDs = append(arrangeItemIDs, aa.ArrangeItemID)
		arrangeOrders = append(arrangeOrders, aa.SubmittedOrder)
		arrangeCorrects = append(arrangeCorrects, aa.IsCorrect)
		arrangeSkips = append(arrangeSkips, aa.IsSkipped)
	}

	var fillQIDs, fillTexts []string
	var fillCorrects, fillSkips []bool
	for _, fa := range answers.FillAnswers {
		fillQIDs = append(fillQIDs, fa.QuestionID)
		fillTexts = append(fillTexts, fa.FillText)
		fillCorrects = append(fillCorrects, fa.IsCorrect)
		fillSkips = append(fillSkips, fa.IsSkipped)
	}

	var (
		isEnrolled bool
		attemptID  *string
	)

	err = a.DB.QueryRow(
		ctx, SaveQuizAttempt,
		quizID, userID, score, passed, correctCount, incorrectCount, skippedCount,
		singleQIDs, singleOptIDs, singleCorrects, singleSkips,
		string(multiJSON),
		arrangeQIDs, arrangeItemIDs, arrangeOrders, arrangeCorrects, arrangeSkips,
		fillQIDs, fillTexts, fillCorrects, fillSkips,
	).Scan(&isEnrolled, &attemptID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}
	if !isEnrolled {
		return "", generic.ErrQuizNotEnrolled
	}
	if attemptID == nil {
		return "", errors.New("failed to save quiz attempt")
	}

	return *attemptID, nil
}
