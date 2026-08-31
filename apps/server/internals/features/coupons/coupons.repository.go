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

func (a *App) AdminListRepository(ctx context.Context, page, limit int, status, isActive, code string) ([]Coupon, int, error) {
	offset := (page - 1) * limit
	filter := postgres.NewFilter(limit, offset)

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
	if payload == nil || payload.Data == nil {
		return []Coupon{}, 0, nil
	}

	return payload.Data, payload.Total, nil
}

func (a *App) TutorListRepository(ctx context.Context, page, limit int, userID, status, isActive, code string) ([]Coupon, int, error) {
	offset := (page - 1) * limit
	filter := postgres.NewFilter(limit, offset)

	filter.Add("c.created_by = $%d", userID)
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
	if payload == nil || payload.Data == nil {
		return []Coupon{}, 0, nil
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

func (a *App) AdminCreateRepository(ctx context.Context, userID string, req CreateCouponRequest) (*Coupon, error) {
	return postgres.QueryWithStatus[Coupon](
		ctx,
		a.DB,
		AdminCreateCoupon,
		createCouponErrMap,
		userID, req.CourseID, req.Code, req.DiscountPercent, req.MaxUsage, req.ExpiresAt, req.IsActive,
	)
}

func (a *App) TutorCreateRepository(ctx context.Context, userID string, req CreateCouponRequest) (*Coupon, error) {
	return postgres.QueryWithStatus[Coupon](
		ctx,
		a.DB,
		TutorCreateCoupon,
		createCouponErrMap,
		userID, req.CourseID, req.Code, req.DiscountPercent, req.MaxUsage, req.ExpiresAt, req.IsActive,
	)
}

func (a *App) AdminUpdateRepository(ctx context.Context, id string, req UpdateCouponRequest) (*Coupon, error) {
	return postgres.QueryWithStatus[Coupon](
		ctx,
		a.DB,
		AdminUpdateCoupon,
		couponItemErrMap,
		id, req.DiscountPercent, req.MaxUsage, req.ExpiresAt, req.IsActive,
	)
}

func (a *App) TutorUpdateRepository(ctx context.Context, id, userID string, req UpdateCouponRequest) (*Coupon, error) {
	return postgres.QueryWithStatus[Coupon](
		ctx,
		a.DB,
		TutorUpdateCoupon,
		couponItemErrMap,
		id, userID, req.DiscountPercent, req.MaxUsage, req.ExpiresAt, req.IsActive,
	)
}

func (a *App) AdminDeleteRepository(ctx context.Context, id string) (string, error) {
	return postgres.QueryIDWithStatus(
		ctx,
		a.DB,
		AdminDeleteCoupon,
		couponItemErrMap,
		id,
	)
}

func (a *App) TutorDeleteRepository(ctx context.Context, id, userID string) (string, error) {
	return postgres.QueryIDWithStatus(
		ctx,
		a.DB,
		TutorDeleteCoupon,
		couponItemErrMap,
		id, userID,
	)
}
