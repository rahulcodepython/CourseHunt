package coupons

type CouponListPayload struct {
	Total int      `json:"total"`
	Data  []Coupon `json:"data"`
}

type couponListCacheData struct {
	Data  []Coupon `json:"data"`
	Total int      `json:"total"`
}
