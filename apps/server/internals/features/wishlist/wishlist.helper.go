package wishlist

type WishlistPayload struct {
	Total int            `json:"total"`
	Data  []WishlistItem `json:"data"`
}

type wishlistListCacheData struct {
	Data  []WishlistItem `json:"data"`
	Total int            `json:"total"`
}
