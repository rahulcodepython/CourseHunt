package transactions

import (
	"context"
	"errors"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"

	"github.com/jackc/pgx/v5"
)

type TransactionListPayload struct {
	Total int           `json:"total"`
	Data  []Transaction `json:"data"`
}

func (a *App) GetPendingTransactionRepository(ctx context.Context, userID, courseID string) (*Transaction, error) {
	return postgres.QueryJSON[Transaction](ctx, a.DB, GetPendingTransaction, userID, courseID)
}

func (a *App) CreateRepository(ctx context.Context, id, userID, courseID string, couponID *string, razorpayOrderID string, amount, actualPrice, offeredPrice, taxPercent, discountAmount float64) (*Transaction, error) {
	return postgres.QueryJSON[Transaction](
		ctx,
		a.DB,
		CreateTransaction,
		id, userID, courseID, razorpayOrderID, amount, couponID, actualPrice, offeredPrice, taxPercent, discountAmount,
	)
}

func (a *App) MarkPaymentCapturedRepository(ctx context.Context, razorpayPaymentID, razorpayOrderID, eventID string) error {
	var txID string
	err := a.DB.QueryRow(ctx, MarkPaymentCaptured, razorpayPaymentID, razorpayOrderID, eventID).Scan(&txID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return generic.ErrTransactionsNotFound
		}
		return postgres.MapPgError(err)
	}
	return nil
}

func (a *App) MarkPaymentFailedRepository(ctx context.Context, errorDescription *string, razorpayOrderID, eventID string) error {
	var txID string
	err := a.DB.QueryRow(ctx, MarkPaymentFailed, errorDescription, razorpayOrderID, eventID).Scan(&txID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return generic.ErrTransactionsNotFound
		}
		return postgres.MapPgError(err)
	}
	return nil
}

func (a *App) ListRepository(ctx context.Context, page, limit int, userID, tutorID, status, courseID, dateFrom, dateTo string) ([]Transaction, int, error) {
	filter := postgres.NewFilter()

	if userID != "" {
		filter.Add("t.user_id = $%d", userID)
	}
	if tutorID != "" {
		filter.Add("c.tutor_id = $%d", tutorID)
	}
	if status != "" {
		filter.Add("t.status = $%d", status)
	}
	if courseID != "" {
		filter.Add("t.course_id = $%d", courseID)
	}
	if dateFrom != "" {
		filter.Add("t.created_at >= $%d", dateFrom)
	}
	if dateTo != "" {
		filter.Add("t.created_at <= $%d", dateTo)
	}

	limitParam := filter.Paginate(page, limit)
	offsetParam := limitParam + 1

	query := BuildListTransactionsQuery(filter.Where(""), limitParam, offsetParam)

	payload, err := postgres.QueryJSON[TransactionListPayload](ctx, a.DB, query, filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil {
		return []Transaction{}, 0, nil
	}
	if payload.Data == nil {
		payload.Data = []Transaction{}
	}
	return payload.Data, payload.Total, nil
}

type CoursePricing struct {
	ActualPrice float64 `json:"actual_price"`
	FinalPrice  float64 `json:"final_price"`
}

func (a *App) GetCoursePricingRepository(ctx context.Context, courseID string) (*CoursePricing, error) {
	return postgres.QueryJSON[CoursePricing](ctx, a.DB, GetCoursePricing, courseID)
}

func (a *App) GetTransactionStatusRepository(ctx context.Context, txID, userID string) (*TransactionStatusResponse, error) {
	return postgres.QueryJSON[TransactionStatusResponse](ctx, a.DB, GetTransactionStatus, txID, userID)
}

func (a *App) GetCheckoutCourseRepository(ctx context.Context, courseID string) (*CheckoutCourseResponse, error) {
	return postgres.QueryJSON[CheckoutCourseResponse](ctx, a.DB, GetCheckoutCourse, courseID)
}

func (a *App) UpsertWebhookEventRepository(ctx context.Context, eventID, eventType string) (alreadyProcessed bool, err error) {
	err = a.DB.QueryRow(ctx, UpsertWebhookEvent, eventID, eventType).Scan(&alreadyProcessed)
	if err != nil {
		return false, postgres.MapPgError(err)
	}
	return alreadyProcessed, nil
}

func (a *App) MarkWebhookEventProcessedRepository(ctx context.Context, eventID string) error {
	_, err := a.DB.Exec(ctx, MarkWebhookEventProcessed, eventID)
	return postgres.MapPgError(err)
}
