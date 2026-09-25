package transactions

import (
	"context"
	"errors"
	"log"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/utils"
)

// Initiate is the sole place the paid amount is ever computed — the client
// never supplies (or can influence) it. Order: start from the course's
// final_price, apply the coupon discount (if any and valid) on top of that,
// then apply tax on the discounted amount.
func (a *App) Initiate(ctx context.Context, userID string, req InitiateTransactionRequest) (*InitiateTransactionResponse, error) {
	resp, err := a.initiate(ctx, userID, req)
	if err != nil {
		if errors.Is(err, generic.ErrCoursesCourseNotFound) {
			return nil, utils.ErrNotFound("Course not found.", err)
		}
		if errors.Is(err, generic.ErrTransactionsInvalidCoupon) {
			return nil, utils.ErrBadRequest("Invalid coupon.", err)
		}
		if errors.Is(err, generic.ErrTransactionsAlreadyEnrolled) {
			return nil, utils.ErrBadRequest(generic.ErrMsgAlreadyEnrolled, err)
		}
		if errors.Is(err, generic.ErrTransactionsCourseIsFree) {
			return nil, utils.ErrBadRequest(generic.ErrMsgFreeCourseDirect, err)
		}
		if errors.Is(err, generic.ErrTransactionsPendingExists) {
			return nil, utils.ErrConflict("You already have a payment in progress for this course. Please wait for it to complete, or try again in a moment.", err)
		}
		return nil, utils.ErrInternal("Failed to initiate transaction.", err)
	}
	return resp, nil
}

func (a *App) HandleWebhook(ctx context.Context, rawBody []byte, signature string, payload WebhookPayload) error {
	if err := a.processWebhook(ctx, rawBody, signature, payload); err != nil {
		log.Printf("Webhook error: %v", err)
		if errors.Is(err, generic.ErrTransactionsInvalidSignature) {
			return utils.ErrUnauthorized("invalid signature", err)
		}
		return utils.ErrInternal("Webhook processing failed", err)
	}
	return nil
}

func (a *App) Status(ctx context.Context, txID, userID string) (*TransactionStatusResponse, error) {
	resp, err := a.GetTransactionStatusRepository(ctx, txID, userID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch transaction status.", err)
	}
	return resp, nil
}

func (a *App) Checkout(ctx context.Context, courseID string) (*CheckoutCourseResponse, error) {
	resp, err := a.GetCheckoutCourseRepository(ctx, courseID)
	if err != nil {
		return nil, utils.ErrInternal("Failed to fetch checkout course info.", err)
	}
	resp.TaxPercent = a.Cfg.TaxPercent
	return resp, nil
}

func (a *App) List(ctx context.Context, page, limit int, userID, tutorID, status, courseID, dateFrom, dateTo, errMsg string) ([]Transaction, int, error) {
	list, total, err := a.ListRepository(ctx, page, limit, userID, tutorID, status, courseID, dateFrom, dateTo)
	if err != nil {
		return nil, 0, utils.ErrInternal(errMsg, err)
	}
	return list, total, nil
}

func (a *App) ListRefunds(ctx context.Context, page, limit int, userID, status, courseID, dateFrom, dateTo, errMsg string) ([]RefundTransaction, int, error) {
	list, total, err := a.ListRefundsRepository(ctx, page, limit, userID, status, courseID, dateFrom, dateTo)
	if err != nil {
		return nil, 0, utils.ErrInternal(errMsg, err)
	}
	return list, total, nil
}
