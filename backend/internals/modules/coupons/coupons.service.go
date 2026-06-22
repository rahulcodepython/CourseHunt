package coupons

func (m *CouponsModule) ListService(page, limit int) ([]Coupon, int, error) {
	return m.ListRepository(page, limit)
}
func (m *CouponsModule) CreateService(createdBy string, req CreateCouponRequest) (*Coupon, error) {
	return m.CreateRepository(createdBy, req)
}
func (m *CouponsModule) UpdateService(id string, req UpdateCouponRequest) (*Coupon, error) {
	return m.UpdateRepository(id, req)
}
func (m *CouponsModule) DeleteService(id string) error { 
	return m.DeleteRepository(id) 
}
func (m *CouponsModule) CheckService(code, courseID string) CouponCheckResponse {
	return m.CheckRepository(code, courseID)
}
