package repositories

import (
	"database/sql"
	"errors"
	"strings"
	"testing"
	"time"

	"coursehunt/server/internals/generic"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
)

func newMockDB(t *testing.T) (*sqlx.DB, sqlmock.Sqlmock) {
	t.Helper()
	mockDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	t.Cleanup(func() { mockDB.Close() })
	return sqlx.NewDb(mockDB, "postgres"), mock
}

func newCouponDB(t *testing.T) (*sqlx.DB, sqlmock.Sqlmock) {
	return newMockDB(t)
}

const couponColumns = "id,code,discount_percent,max_usage,usage_count,expires_at,is_active,created_by,created_at,course.id,course.title,course.thumbnail"

func TestCouponsRepositoryReadByCode(t *testing.T) {
	db, mock := newCouponDB(t)

	exp := time.Date(2030, 1, 1, 0, 0, 0, 0, time.UTC)
	now := time.Now().UTC().Truncate(time.Second)

	mock.ExpectQuery("WHERE c.code = \\$1").
		WithArgs("WELCOME10").
		WillReturnRows(sqlmock.NewRows(strings.Split(couponColumns, ",")).
			AddRow("c1", "WELCOME10", 10.5, 100, 3, exp, true, "owner-1", now, "course-1", "Intro to Go", nil))

	repo := NewCouponsRepository(db, nil, nil)
	c, err := repo.ReadByCodeRepository("WELCOME10")
	if err != nil {
		t.Fatalf("ReadByCodeRepository: %v", err)
	}

	if c.ID != "c1" || c.Code != "WELCOME10" {
		t.Fatalf("unexpected coupon identity: %+v", c)
	}
	if c.DiscountPercent != 10.5 {
		t.Fatalf("discount = %v, want 10.5", c.DiscountPercent)
	}
	if c.UsageCount != 3 {
		t.Fatalf("usage count = %d, want 3", c.UsageCount)
	}
	if !c.ExpiresAt.Equal(exp) {
		t.Fatalf("expires_at = %v, want %v", c.ExpiresAt, exp)
	}
	if c.IsActive != true {
		t.Fatal("should be active")
	}
	if c.Course.ID != "course-1" || c.Course.Title != "Intro to Go" {
		t.Fatalf("course mapping wrong: %+v", c.Course)
	}
	if c.Course.Thumbnail != nil {
		t.Fatalf("thumbnail should be nil, got %v", *c.Course.Thumbnail)
	}
}

func TestCouponsRepositoryReadByCodeNotFound(t *testing.T) {
	db, mock := newCouponDB(t)
	mock.ExpectQuery("WHERE c.code = \\$1").
		WithArgs("NOPE").
		WillReturnError(sql.ErrNoRows)

	repo := NewCouponsRepository(db, nil, nil)
	_, err := repo.ReadByCodeRepository("NOPE")
	if err != generic.ErrCouponNotFound {
		t.Fatalf("error = %v, want ErrCouponNotFound (%v)", err, generic.ErrCouponNotFound)
	}
}

func TestCouponsRepositoryReadByCodeDBError(t *testing.T) {
	db, mock := newCouponDB(t)
	mock.ExpectQuery("WHERE c.code = \\$1").
		WithArgs("X").
		WillReturnError(errors.New("connection reset"))

	repo := NewCouponsRepository(db, nil, nil)
	_, err := repo.ReadByCodeRepository("X")
	if err != generic.ErrCouponNotFound {
		t.Fatalf("error = %v, want ErrCouponNotFound", err)
	}
}