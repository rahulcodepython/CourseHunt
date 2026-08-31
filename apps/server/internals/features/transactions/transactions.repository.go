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

func (a *App) InitiateClaimRepository(ctx context.Context, userID, courseID, txID string) (alreadyEnrolled, claimed bool, err error) {
	err = a.DB.QueryRow(ctx, InitiateClaim, userID, courseID, txID).Scan(&alreadyEnrolled, &claimed)
	if err != nil {
		return false, false, postgres.MapPgError(err)
	}
	return alreadyEnrolled, claimed, nil
}

func (a *App) FinalizeClaimedTransactionRepository(ctx context.Context, txID, razorpayOrderID string, amount, actualPrice, offeredPrice, taxPercent, discountAmount float64, couponID *string) error {
	_, err := a.DB.Exec(ctx, FinalizeClaimedTransaction, txID, razorpayOrderID, amount, actualPrice, offeredPrice, taxPercent, discountAmount, couponID)
	return postgres.MapPgError(err)
}

func (a *App) MarkTransactionFailedRepository(ctx context.Context, txID, reason string) error {
	_, err := a.DB.Exec(ctx, MarkTransactionFailed, txID, reason)
	return postgres.MapPgError(err)
}

func (a *App) MarkPaymentCapturedRepository(ctx context.Context, razorpayPaymentID, razorpayOrderID, eventID string) (string, bool, string, string, error) {
	var txID, refundID, retPaymentID string
	var isDuplicate bool
	err := a.DB.QueryRow(ctx, MarkPaymentCaptured, razorpayPaymentID, razorpayOrderID, eventID).Scan(&txID, &isDuplicate, &refundID, &retPaymentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", false, "", "", generic.ErrTransactionsNotFound
		}
		return "", false, "", "", postgres.MapPgError(err)
	}
	return txID, isDuplicate, refundID, retPaymentID, nil
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

func (a *App) MarkRefundPendingRepository(ctx context.Context, refundID, razorpayRefundID string) error {
	_, err := a.DB.Exec(ctx, MarkRefundPending, refundID, razorpayRefundID)
	return postgres.MapPgError(err)
}

func (a *App) MarkRefundProcessedRepository(ctx context.Context, razorpayRefundID, razorpayPaymentID, eventID string) error {
	var id string
	err := a.DB.QueryRow(ctx, MarkRefundProcessed, razorpayRefundID, razorpayPaymentID, eventID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return postgres.MapPgError(err)
	}
	return nil
}

func (a *App) MarkRefundFailedRepository(ctx context.Context, refundID, errorDescription string) error {
	_, err := a.DB.Exec(ctx, MarkRefundFailed, refundID, errorDescription)
	return postgres.MapPgError(err)
}

func (a *App) MarkRefundFailedByRazorpayIDRepository(ctx context.Context, razorpayRefundID, eventID string) error {
	var id string
	err := a.DB.QueryRow(ctx, MarkRefundFailedByRazorpayID, razorpayRefundID, eventID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
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

func (a *App) ListRefundsRepository(ctx context.Context, page, limit int, userID, status, courseID, dateFrom, dateTo string) ([]RefundTransaction, int, error) {
	filter := postgres.NewFilter()

	if userID != "" {
		filter.Add("r.user_id = $%d", userID)
	}
	if status != "" {
		filter.Add("r.refund_status = $%d", status)
	}
	if courseID != "" {
		filter.Add("r.course_id = $%d", courseID)
	}
	if dateFrom != "" {
		filter.Add("r.created_at >= $%d", dateFrom)
	}
	if dateTo != "" {
		filter.Add("r.created_at <= $%d", dateTo)
	}

	limitParam := filter.Paginate(page, limit)
	offsetParam := limitParam + 1

	query := BuildListRefundsQuery(filter.Where(""), limitParam, offsetParam)

	payload, err := postgres.QueryJSON[RefundListPayload](ctx, a.DB, query, filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil {
		return []RefundTransaction{}, 0, nil
	}
	if payload.Data == nil {
		payload.Data = []RefundTransaction{}
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
