package users

import (
	"context"
	"fmt"
	"time"
)

// ShouldRecordUserActivity debounces user activity logging in Redis with a 15-minute TTL
// to eliminate repetitive write amplification on frequent logins/pings.
func (a *App) ShouldRecordUserActivity(ctx context.Context, userID string) (bool, error) {
	if a.Cache == nil || userID == "" {
		return true, nil
	}
	key := fmt.Sprintf("user:activity:debounce:%s", userID)
	return a.Cache.SetNX(ctx, key, "1", 15*time.Minute)
}
