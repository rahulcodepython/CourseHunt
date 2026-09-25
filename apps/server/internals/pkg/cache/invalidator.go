package cache

import (
	"context"
	"fmt"
	"log/slog"
)

// Invalidate purges the cache keys matching each given pattern (e.g. "courses:*").
func (c *Cache) Invalidate(ctx context.Context, patterns ...string) {
	for _, p := range patterns {
		slog.Info("invalidating cache", "pattern", p)
		_ = c.DeleteByPattern(ctx, p)
	}
}

// InvalidateWishlist purges wishlist cache entries for a user (or every
// wishlist entry when userID is empty) — kept as a dedicated method since
// the pattern itself depends on the argument, unlike every other domain.
func (c *Cache) InvalidateWishlist(ctx context.Context, userID string) {
	if userID != "" {
		c.Invalidate(ctx, fmt.Sprintf("wishlist:user:%s:*", userID))
	} else {
		c.Invalidate(ctx, "wishlist:*")
	}
}
