package coupons

type couponListCacheData struct {
	Data  []Coupon `json:"data"`
	Total int      `json:"total"`
}
