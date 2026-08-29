package quiz

import (
	"context"
	"encoding/json"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"

	"github.com/jackc/pgx/v5"
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

func (a *App) SaveQuizAttemptRepository(ctx context.Context, quizID, userID string, score float64, passed bool, correctCount, incorrectCount, skippedCount int, answers QuizAnswersToSave) (string, error) {
	var attemptID string

	err := postgres.WithTx(ctx, a.DB, func(tx pgx.Tx) error {
		var isEnrolled bool
		if err := tx.QueryRow(ctx, CheckQuizEnrollment, quizID, userID).Scan(&isEnrolled); err != nil {
			return err
		}
		if !isEnrolled {
			return generic.ErrQuizNotEnrolled
		}

		if err := tx.QueryRow(ctx, InsertQuizAttempt, quizID, userID, score, passed, correctCount, incorrectCount, skippedCount).Scan(&attemptID); err != nil {
			return err
		}

		// 1. Single answers
		for _, sa := range answers.SingleAnswers {
			_, err := tx.Exec(ctx, InsertSingleAnswer, attemptID, sa.QuestionID, sa.SelectedOptionID, sa.IsCorrect, sa.IsSkipped)
			if err != nil {
				return err
			}
		}

		// 2. Multi answers + junction
		for _, ma := range answers.MultiAnswers {
			var multiAnswerID string
			err := tx.QueryRow(ctx, InsertMultiAnswer, attemptID, ma.Answer.QuestionID, ma.Answer.IsCorrect, ma.Answer.IsSkipped).Scan(&multiAnswerID)
			if err != nil {
				return err
			}

			for _, optID := range ma.SelectedOptionIDs {
				_, err := tx.Exec(ctx, InsertMultiAnswerOption, multiAnswerID, optID)
				if err != nil {
					return err
				}
			}
		}

		// 3. Arrange answers
		for _, aa := range answers.ArrangeAnswers {
			_, err := tx.Exec(ctx, InsertArrangeAnswer, attemptID, aa.QuestionID, aa.ArrangeItemID, aa.SubmittedOrder, aa.IsCorrect, aa.IsSkipped)
			if err != nil {
				return err
			}
		}

		// 4. Fill answers
		for _, fa := range answers.FillAnswers {
			_, err := tx.Exec(ctx, InsertFillAnswer, attemptID, fa.QuestionID, fa.FillText, fa.IsCorrect, fa.IsSkipped)
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return "", err
	}

	return attemptID, nil
}
