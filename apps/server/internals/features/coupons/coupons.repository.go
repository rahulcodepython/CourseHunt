package coupons

import (
	"context"

	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/pkg/postgres"
)

type CouponListPayload struct {
	Total int      `json:"total"`
	Data  []Coupon `json:"data"`
}

func (a *App) CourseAllowsCouponRepository(ctx context.Context, courseID string) (bool, error) {
	var allowed bool
	err := a.DB.QueryRow(ctx, CourseAllowsCoupon, courseID).Scan(&allowed)
	if err != nil {
		return false, generic.ErrCoursesCourseNotFound
	}
	return allowed, nil
}

func (a *App) ReadByCodeRepository(ctx context.Context, code string) (*Coupon, error) {
	coupon, err := postgres.QueryJSON[Coupon](ctx, a.DB, ReadByCodeJSON, code)
	if err != nil {
		return nil, postgres.MapPgError(err)
	}
	if coupon == nil {
		return nil, generic.ErrCouponNotFound
	}
	return coupon, nil
}

func (a *App) ListRepository(ctx context.Context, page, limit int, userID string, scope generic.AuthScope, status, isActive, code string) ([]Coupon, int, error) {
	offset := (page - 1) * limit
	filter := postgres.NewFilter(limit, offset)

	if scope != generic.ScopeAdmin {
		filter.Add("c.created_by = $%d", userID)
	}
	if status != "" {
		filter.Add("c.is_active = $%d::boolean", status)
	}
	if isActive == "true" || isActive == "false" {
		filter.Add("c.is_active = $%d", isActive == "true")
	}
	if code != "" {
		filter.Add("c.code ILIKE $%d", "%"+code+"%")
	}

	payload, err := postgres.QueryJSON[CouponListPayload](ctx, a.DB, BuildListQuery(filter.Join("1=1")), filter.Args...)
	if err != nil {
		return nil, 0, err
	}
	if payload == nil {
		return []Coupon{}, 0, nil
	}
	if payload.Data == nil {
		payload.Data = []Coupon{}
	}

	return payload.Data, payload.Total, nil
}

var (
	createCouponErrMap = postgres.StatusErrorMap{
		0: generic.ErrCouponsCourseNotFound,
		1: generic.ErrCouponsUnauthorized,
		3: generic.ErrCouponsCourseRequired,
	}
	couponItemErrMap = postgres.StatusErrorMap{
		0: generic.ErrCouponNotFound,
		1: generic.ErrCouponsUnauthorized,
	}
)

func (a *App) CreateRepository(ctx context.Context, userID string, scope generic.AuthScope, req CreateCouponRequest) (*Coupon, error) {
	return postgres.QueryWithStatus[Coupon](
		ctx,
		a.DB,
		CreateCoupon,
		createCouponErrMap,
		userID, req.CourseID, req.Code, req.DiscountPercent, req.MaxUsage, req.ExpiresAt, req.IsActive, string(scope),
	)
}

func (a *App) UpdateRepository(ctx context.Context, id, userID string, scope generic.AuthScope, req UpdateCouponRequest) (*Coupon, error) {
	return postgres.QueryWithStatus[Coupon](
		ctx,
		a.DB,
		UpdateCoupon,
		couponItemErrMap,
		id, userID, req.DiscountPercent, req.MaxUsage, req.ExpiresAt, req.IsActive, string(scope),
	)
}

func (a *App) DeleteRepository(ctx context.Context, id, userID string, scope generic.AuthScope) (string, error) {
	return postgres.QueryIDWithStatus(
		ctx,
		a.DB,
		DeleteCoupon,
		couponItemErrMap,
		id, userID, string(scope),
	)
}
