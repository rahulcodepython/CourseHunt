package cache

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"
)

// Invalidate purges cache keys matching given patterns.
// Exact keys are deleted immediately; wildcard patterns are processed asynchronously
// so that synchronous HTTP request latency is never blocked by Redis scanning.
func (c *Cache) Invalidate(ctx context.Context, patterns ...string) {
	if c == nil || c.client == nil || len(patterns) == 0 {
		return
	}

	var directKeys []string
	var asyncPatterns []string

	for _, p := range patterns {
		if strings.ContainsAny(p, "*?") {
			asyncPatterns = append(asyncPatterns, p)
		} else {
			directKeys = append(directKeys, p)
		}
	}

	if len(directKeys) > 0 {
		_ = c.Delete(ctx, directKeys...)
	}

	if len(asyncPatterns) > 0 {
		go func(pats []string) {
			bgCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
			defer cancel()
			for _, p := range pats {
				slog.Debug("async invalidating cache pattern", "pattern", p)
				_ = c.DeleteByPattern(bgCtx, p)
			}
		}(asyncPatterns)
	}
}

// InvalidateWishlist purges wishlist cache entries for a user (or every
// wishlist entry when userID is empty).
func (c *Cache) InvalidateWishlist(ctx context.Context, userID string) {
	if userID != "" {
		c.Invalidate(ctx, fmt.Sprintf("wishlist:user:%s:*", userID))
	} else {
		c.Invalidate(ctx, "wishlist:*")
	}
}
