package transactions

import (
	"context"
	"log/slog"
	"sync"
	"time"
)

const (
	refundWorkerCount = 4
	refundQueueSize   = 256
)

type refundJob struct {
	refundID  string
	paymentID string
}

var (
	refundQueue     chan refundJob
	refundQueueOnce sync.Once
)

func (a *App) startRefundWorkers() {
	refundQueue = make(chan refundJob, refundQueueSize)
	for range refundWorkerCount {
		go func() {
			for job := range refundQueue {
				a.processDuplicateRefund(job.refundID, job.paymentID)
			}
		}()
	}
}

func (a *App) enqueueDuplicateRefund(refundID, paymentID string) {
	if refundID == "" || paymentID == "" {
		return
	}
	refundQueueOnce.Do(a.startRefundWorkers)

	job := refundJob{refundID: refundID, paymentID: paymentID}
	select {
	case refundQueue <- job:
	default:
		slog.Warn("refund queue full, dropping immediate auto-refund dispatch", "refund_id", refundID, "payment_id", paymentID)
	}
}

func (a *App) processDuplicateRefund(refundID, paymentID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	refund, err := a.Rzp.RefundPayment(ctx, paymentID)
	if err != nil {
		slog.Error("duplicate auto-refund failed via razorpay", "refund_id", refundID, "payment_id", paymentID, "error", err)
		_ = a.MarkRefundFailedRepository(ctx, refundID, err.Error())
		return
	}

	if err := a.MarkRefundPendingRepository(ctx, refundID, refund.ID); err != nil {
		slog.Error("failed to update refund record with razorpay refund id", "refund_id", refundID, "razorpay_refund_id", refund.ID, "error", err)
	}
}
