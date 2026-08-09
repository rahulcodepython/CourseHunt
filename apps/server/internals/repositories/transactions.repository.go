package repositories

import (
	"context"
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/entities"
	"coursehunt/server/internals/pkg/razorpay"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

type TransactionsRepository struct {
	DB              *sqlx.DB
	CouponsRepo     *CouponsRepository
	CoursesRepo     *CoursesRepository
	EnrollmentsRepo *EnrollmentsRepository
	Razorpay        *razorpay.Client
	Config          *config.Config
}

func NewTransactionsRepository(db *sqlx.DB, couponsRepo *CouponsRepository, coursesRepo *CoursesRepository, enrollmentsRepo *EnrollmentsRepository, rzp *razorpay.Client, cfg *config.Config) *TransactionsRepository {
	return &TransactionsRepository{DB: db, CouponsRepo: couponsRepo, CoursesRepo: coursesRepo, EnrollmentsRepo: enrollmentsRepo, Razorpay: rzp, Config: cfg}
}

// ── Shared scan target ──

const transactionColumns = `id, user_id, course_id, coupon_id, razorpay_order_id,
	razorpay_payment_id, amount, currency, status, error_description, confirmed_at, created_at`

type transactionRow struct {
	ID                string     `db:"id"`
	UserID            string     `db:"user_id"`
	CourseID          string     `db:"course_id"`
	CouponID          *string    `db:"coupon_id"`
	RazorpayOrderID   *string    `db:"razorpay_order_id"`
	RazorpayPaymentID *string    `db:"razorpay_payment_id"`
	Amount            float64    `db:"amount"`
	Currency          string     `db:"currency"`
	Status            string     `db:"status"`
	ErrorDescription  *string    `db:"error_description"`
	ConfirmedAt       *time.Time `db:"confirmed_at"`
	CreatedAt         time.Time  `db:"created_at"`
}

func (r transactionRow) toTransaction() entities.Transaction {
	t := entities.Transaction{
		ID:                r.ID,
		RazorpayOrderID:   r.RazorpayOrderID,
		RazorpayPaymentID: r.RazorpayPaymentID,
		Amount:            r.Amount,
		Currency:          r.Currency,
		Status:            r.Status,
		ErrorDescription:  r.ErrorDescription,
		ConfirmedAt:       r.ConfirmedAt,
		CreatedAt:         r.CreatedAt,
	}
	t.User.ID = r.UserID
	t.Course.ID = r.CourseID
	if r.CouponID != nil {
		t.Coupon.ID = *r.CouponID
	}
	return t
}

// ── Writes ──

// CreateRepository now takes the pre-generated id AND the already-known
// Razorpay order id, so the transaction row is written ONCE, fully formed.
// Previously this was: INSERT (pending, no order id) -> UPDATE (attach order
// id) = 2 round trips every single time. The service layer now creates the
// Razorpay order first (using a client-generated id as the reference) and
// only writes to the DB once that succeeds, so this is the only DB write in
// the common path, and there is NO write at all if order creation fails
// (previously a "pending" row was inserted and then immediately flipped to
// "failed" - a wasted INSERT + UPDATE on every gateway error).
func (r *TransactionsRepository) CreateRepository(ctx context.Context, id, userID, courseID string, couponID *string, razorpayOrderID string, amount float64) (*entities.Transaction, error) {
	var row transactionRow
	err := r.DB.GetContext(ctx, &row, `
		INSERT INTO transactions (id, user_id, course_id, coupon_id, razorpay_order_id, amount, currency, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'INR', 'pending')
		RETURNING `+transactionColumns,
		id, userID, courseID, couponID, razorpayOrderID, amount,
	)
	if err != nil {
		return nil, err
	}
	t := row.toTransaction()
	return &t, nil
}

func (r *TransactionsRepository) MarkSuccessAndWebhookProcessedRepository(ctx context.Context, txID, razorpayPaymentID, eventID string) error {
	_, err := r.DB.ExecContext(ctx, `
		WITH updated_tx AS (
			UPDATE transactions
			SET status = 'success', razorpay_payment_id = $1, confirmed_at = CURRENT_TIMESTAMP
			WHERE id = $2
		)
		UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $3`,
		razorpayPaymentID, txID, eventID)
	return err
}

func (r *TransactionsRepository) MarkFailedAndWebhookProcessedRepository(ctx context.Context, txID string, desc *string, eventID string) error {
	_, err := r.DB.ExecContext(ctx, `
		WITH updated_tx AS (
			UPDATE transactions SET status = 'failed', error_description = $1 WHERE id = $2
		)
		UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $3`,
		desc, txID, eventID)
	return err
}

// ── Reads ──

func (r *TransactionsRepository) FindByRazorpayOrderIDRepository(ctx context.Context, orderID string) (*entities.Transaction, error) {
	var row transactionRow
	err := r.DB.GetContext(ctx, &row, `SELECT `+transactionColumns+` FROM transactions WHERE razorpay_order_id = $1`, orderID)
	if err != nil {
		return nil, err
	}
	t := row.toTransaction()
	return &t, nil
}

func (r *TransactionsRepository) ListRepository(ctx context.Context, page, limit int, userID, tutorID, status, courseID, dateFrom, dateTo string) ([]entities.Transaction, int, error) {
	offset := (page - 1) * limit
	total := 0

	var args []any
	var whereClauses []string

	addFilter := func(clause string, val any) {
		args = append(args, val)
		whereClauses = append(whereClauses, fmt.Sprintf(clause, len(args)))
	}
	if userID != "" {
		addFilter("t.user_id = $%d", userID)
	}
	if tutorID != "" {
		addFilter("c.tutor_id = $%d", tutorID)
	}
	if status != "" {
		addFilter("t.status = $%d", status)
	}
	if courseID != "" {
		addFilter("t.course_id = $%d", courseID)
	}
	if dateFrom != "" {
		addFilter("t.created_at >= $%d", dateFrom)
	}
	if dateTo != "" {
		addFilter("t.created_at <= $%d", dateTo)
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + whereClauses[0]
		for _, wc := range whereClauses[1:] {
			whereClause += " AND " + wc
		}
	}

	// Already efficient: single query returns both the page of rows AND the
	// total count via COUNT(*) OVER(), and joins are done in SQL rather than
	// N+1 fetches from Go. Left unchanged except for formatting.
	query := `
		SELECT 
			json_build_object(
				'id', t.id,
				'amount', t.amount,
				'currency', t.currency,
				'status', t.status,
				'razorpay_order_id', t.razorpay_order_id,
				'razorpay_payment_id', t.razorpay_payment_id,
				'error_description', t.error_description,
				'confirmed_at', t.confirmed_at,
				'created_at', t.created_at,
				'user', json_build_object('id', t.user_id, 'name', COALESCE(u.name, ''), 'image', u.image),
				'course', json_build_object('id', t.course_id, 'title', COALESCE(c.title, ''), 'thumbnail', c.image_url),
				'coupon', CASE WHEN t.coupon_id IS NOT NULL THEN json_build_object('id', t.coupon_id, 'code', COALESCE(cp.code, ''), 'discount_percent', COALESCE(cp.discount_percent, 0)) ELSE json_build_object('id', '', 'code', '', 'discount_percent', 0) END
			) AS data,
			COUNT(*) OVER() AS total_count
		FROM transactions t
		LEFT JOIN "user" u ON u.id = t.user_id
		LEFT JOIN courses c ON c.id = t.course_id
		LEFT JOIN coupons cp ON cp.id = t.coupon_id
		` + whereClause + `
		ORDER BY t.created_at DESC 
		LIMIT $` + fmt.Sprint(len(args)+1) + ` OFFSET $` + fmt.Sprint(len(args)+2)

	args = append(args, limit, offset)

	var rows []struct {
		Data       []byte `db:"data"`
		TotalCount int    `db:"total_count"`
	}
	if err := r.DB.SelectContext(ctx, &rows, query, args...); err != nil {
		return nil, 0, err
	}

	list := make([]entities.Transaction, 0, len(rows))
	for _, r := range rows {
		var tx entities.Transaction
		if err := json.Unmarshal(r.Data, &tx); err != nil {
			return nil, 0, err
		}
		list = append(list, tx)
		total = r.TotalCount
	}

	return list, total, nil
}

func (r *TransactionsRepository) GetCoursePriceRepository(ctx context.Context, courseID string) (float64, error) {
	var price float64
	err := r.DB.GetContext(ctx, &price, `SELECT final_price FROM courses WHERE id = $1`, courseID)
	return price, err
}

// ── Webhook events ──

// UpsertWebhookEventRepository replaces the previous pair of calls
// (WebhookEventExistsRepository + StoreWebhookEventRepository), which always
// cost 2 round trips before any real processing began. This does an
// INSERT ... ON CONFLICT DO UPDATE ... RETURNING processed, which is a single
// round trip whether the event is new or a retry:
//   - New event: row is inserted as unprocessed, RETURNING gives back `false`.
//   - Retry (already logged, not yet processed - e.g. previous attempt
//     crashed mid-webhook): the DO UPDATE is a no-op write that still lets us
//     RETURNING the current `processed` value.
//   - Retry (already fully processed): RETURNING gives back `true`, caller
//     short-circuits.
func (r *TransactionsRepository) UpsertWebhookEventRepository(ctx context.Context, eventID, eventType string) (alreadyProcessed bool, err error) {
	err = r.DB.GetContext(ctx, &alreadyProcessed, `
		INSERT INTO webhook_events (razorpay_event_id, event_type, processed)
		VALUES ($1, $2, false)
		ON CONFLICT (razorpay_event_id) DO UPDATE SET event_type = webhook_events.event_type
		RETURNING processed`, eventID, eventType)
	return alreadyProcessed, err
}

// MarkWebhookEventProcessedRepository is kept only for event types the
// switch in HandleWebhookService doesn't otherwise handle (nothing to update
// on the transactions table, but we still need to close out the event so
// Razorpay stops retrying it). For "payment.captured" / "payment.failed" use
// the combined Mark*AndWebhookProcessedRepository functions above instead.
func (r *TransactionsRepository) MarkWebhookEventProcessedRepository(ctx context.Context, eventID string) error {
	_, err := r.DB.ExecContext(ctx, `UPDATE webhook_events SET processed = true WHERE razorpay_event_id = $1`, eventID)
	return err
}

func (r *TransactionsRepository) GetTransactionStatusRepository(ctx context.Context, txID, userID string) (*entities.TransactionStatusResponse, error) {
	var resp entities.TransactionStatusResponse
	err := r.DB.GetContext(ctx, &resp, `
		SELECT
			id,
			status,
			error_description,
			CASE WHEN status IN ('success', 'failed') THEN true ELSE false END AS webhook_processed,
			razorpay_order_id
		FROM transactions
		WHERE id = $1 AND user_id = $2`, txID, userID)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

func (r *TransactionsRepository) GetCheckoutCourseRepository(ctx context.Context, courseID string) (*entities.CheckoutCourseResponse, error) {
	var resp entities.CheckoutCourseResponse
	err := r.DB.GetContext(ctx, &resp, `
		SELECT
			c.id, c.title, c.image_url, c.actual_price, c.final_price,
			u.id AS "instructor.id",
			COALESCE(u.name, '') AS "instructor.name",
			u.image AS "instructor.image"
		FROM courses c
		JOIN "users" u ON u.id = c.tutor_id
		WHERE c.id = $1`, courseID)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}
