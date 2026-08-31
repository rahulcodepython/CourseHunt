package quiz

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
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

func (a *App) AdminReadMetadataRepository(ctx context.Context, lessonID string) (*QuizMetadata, error) {
	var (
		lessonExists bool
		isOwner      bool
		data         []byte
	)

	err := a.DB.QueryRow(ctx, ReadMetadata, lessonID, "admin", "").Scan(&lessonExists, &isOwner, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !lessonExists, Err: generic.ErrQuizLessonNotFound},
		postgres.Condition{Failed: len(data) == 0 || string(data) == "null", Err: generic.ErrQuizNotFound},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[QuizMetadata](data)
}

func (a *App) TutorReadMetadataRepository(ctx context.Context, lessonID, userID string) (*QuizMetadata, error) {
	var (
		lessonExists bool
		isOwner      bool
		data         []byte
	)

	err := a.DB.QueryRow(ctx, ReadMetadata, lessonID, "tutor", userID).Scan(&lessonExists, &isOwner, &data)
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

func (a *App) AdminListQuestionsRepository(ctx context.Context, quizID string) ([]QuizQuestionDetail, error) {
	var (
		quizExists bool
		isOwner    bool
		data       []byte
	)

	err := a.DB.QueryRow(ctx, ListQuestions, quizID, "admin", "").Scan(&quizExists, &isOwner, &data)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if !quizExists {
		return nil, generic.ErrQuizNotFound
	}

	return postgres.DecodeJSONSlice[QuizQuestionDetail](data)
}

func (a *App) TutorListQuestionsRepository(ctx context.Context, quizID, userID string) ([]QuizQuestionDetail, error) {
	var (
		quizExists bool
		isOwner    bool
		data       []byte
	)

	err := a.DB.QueryRow(ctx, ListQuestions, quizID, "tutor", userID).Scan(&quizExists, &isOwner, &data)
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
		questionExists bool
		isOwner        bool
		questionData   []byte
	)

	err := a.DB.QueryRow(
		ctx,
		UpdateQuestionFull,
		questionID, tutorID, req.QuestionType, req.QuestionText, req.Points, req.FillBlankHint,
		optTexts, optCorrects, arrTexts, arrOrders, req.FillAnswers,
	).Scan(&questionExists, &isOwner, &questionData)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}

	if err := postgres.CheckConditions(
		postgres.Condition{Failed: !questionExists, Err: generic.ErrQuizQuestionNotFound},
		postgres.Condition{Failed: !isOwner, Err: generic.ErrQuizAccessDenied},
		postgres.Condition{Failed: len(questionData) == 0 || string(questionData) == "null", Err: errors.New("failed to update question")},
	); err != nil {
		return nil, err
	}

	return postgres.DecodeJSON[QuizQuestion](questionData)
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
	); err != nil {
		return "", err
	}

	return *deletedID, nil
}
