package wishlist

type wishlistListCacheData struct {
	Data  []WishlistItem `json:"data"`
	Total int            `json:"total"`
}
