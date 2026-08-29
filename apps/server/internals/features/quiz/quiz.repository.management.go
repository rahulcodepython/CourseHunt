package quiz

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"

	"github.com/jackc/pgx/v5"
)

func (a *App) CreateMetadataRepository(ctx context.Context, lessonID, tutorID string, req CreateQuizRequest) (*QuizMetadata, error) {
	var (
		lessonExists bool
		isOwner      bool
		data         []byte
	)

	err := a.DB.QueryRow(
		ctx,
		CreateMetadata,
		lessonID, req.Title, req.TimeLimitSeconds, req.PassScorePercent, tutorID,
	).Scan(&lessonExists, &isOwner, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrQuizLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrQuizAccessDenied},
		postgres.Condition{Failed: len(data) == 0 || string(data) == "null", Err: errors.New("failed to save quiz")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[QuizMetadata](data)
}

func (a *App) ReadMetadataRepository(ctx context.Context, lessonID, userID string, scope generic.AuthScope) (*QuizMetadata, error) {
	var (
		lessonExists bool
		isOwner      bool
		data         []byte
	)

	err := a.DB.QueryRow(ctx, ReadMetadata, lessonID, string(scope), userID).Scan(&lessonExists, &isOwner, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrQuizLessonNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrQuizAccessDenied},
		postgres.Condition{Failed: len(data) == 0 || string(data) == "null", Err: generic.ErrQuizNotFound},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[QuizMetadata](data)
}

func (a *App) ListQuestionsRepository(ctx context.Context, quizID, userID string, scope generic.AuthScope) ([]QuizQuestionDetail, error) {
	var (
		quizExists bool
		isOwner    bool
		data       []byte
	)

	err := a.DB.QueryRow(ctx, ListQuestions, quizID, string(scope), userID).Scan(&quizExists, &isOwner, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !quizExists, Err: generic.ErrQuizNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrQuizAccessDenied},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSONSlice[QuizQuestionDetail](data)
}

func (a *App) CreateQuestionRepository(ctx context.Context, quizID, tutorID string, req CreateQuestionRequest) (*QuizQuestion, error) {
	var optTexts []string
	var optCorrects []bool
	for _, o := range req.Options {
		optTexts = append(optTexts, o.OptionText)
		optCorrects = append(optCorrects, o.IsCorrect)
	}

	var arrTexts []string
	var arrOrders []int64
	for _, it := range req.ArrangeItems {
		arrTexts = append(arrTexts, it.ItemText)
		arrOrders = append(arrOrders, int64(it.CorrectOrder))
	}

	var (
		quizExists   bool
		isOwner      bool
		questionData []byte
	)

	err := a.DB.QueryRow(
		ctx,
		CreateQuestion,
		quizID, tutorID, req.QuestionType, req.QuestionText, req.Points, req.FillBlankHint,
		optTexts, optCorrects, arrTexts, arrOrders, req.FillAnswers,
	).Scan(&quizExists, &isOwner, &questionData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !quizExists, Err: generic.ErrQuizNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrQuizAccessDenied},
		postgres.Condition{Failed: len(questionData) == 0 || string(questionData) == "null", Err: errors.New("failed to save question")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[QuizQuestion](questionData)
}

func (a *App) UpdateQuestionRepository(ctx context.Context, questionID, tutorID string, req CreateQuestionRequest) (*QuizQuestion, error) {
	var question QuizQuestion

	err := postgres.WithTx(ctx, a.DB, func(tx pgx.Tx) error {
		var (
			questionExists bool
			isOwner        bool
		)
		if err := tx.QueryRow(ctx, CheckQuestionOwner, questionID, tutorID).Scan(&questionExists, &isOwner); err != nil {
			return err
		}

		if err := postgres.CheckConditions(
			postgres.Condition{Failed: !questionExists, Err: generic.ErrQuizQuestionNotFound},
			postgres.Condition{Failed: !isOwner, Err: generic.ErrQuizAccessDenied},
		); err != nil {
			return err
		}

		if err := tx.QueryRow(
			ctx, UpdateQuestion, questionID, req.QuestionType, req.QuestionText, req.Points, req.FillBlankHint,
		).Scan(
			&question.ID, &question.QuizID, &question.QuestionType, &question.QuestionText,
			&question.Points, &question.FillBlankHint, &question.CreatedAt, &question.UpdatedAt,
		); err != nil {
			return err
		}

		if _, err := tx.Exec(ctx, DeleteQuestionOptions, questionID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, DeleteQuestionArrangeItems, questionID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, DeleteQuestionFillAnswers, questionID); err != nil {
			return err
		}

		for _, o := range req.Options {
			if _, err := tx.Exec(ctx, InsertQuestionOption, questionID, o.OptionText, o.IsCorrect); err != nil {
				return err
			}
		}
		for _, arr := range req.ArrangeItems {
			if _, err := tx.Exec(ctx, InsertQuestionArrangeItem, questionID, arr.ItemText, arr.CorrectOrder); err != nil {
				return err
			}
		}
		for _, ans := range req.FillAnswers {
			if _, err := tx.Exec(ctx, InsertQuestionFillAnswer, questionID, ans); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}
	return &question, nil
}

func (a *App) DeleteQuestionRepository(ctx context.Context, id, tutorID string) (string, error) {
	var (
		questionExists bool
		isOwner        bool
		deletedID      *string
	)

	err := a.DB.QueryRow(ctx, DeleteQuestion, id, tutorID).Scan(&questionExists, &isOwner, &deletedID)
	if err != nil {
		return "", postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !questionExists, Err: generic.ErrQuizQuestionNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrQuizAccessDenied},
		postgres.Condition{Failed: deletedID == nil, Err: errors.New("failed to delete question")},
	); err != nil {
		return "", err
	}

	return *deletedID, nil
}
