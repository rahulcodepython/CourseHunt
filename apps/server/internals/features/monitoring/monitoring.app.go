package monitoring

import (
	"context"
	"fmt"
	"os"
	"time"

	"coursehunt/server/internals/config"
	"coursehunt/server/internals/pkg/cache"
	"coursehunt/server/internals/pkg/minio"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

const (
	InstanceHeartbeatKey = "cluster:backend_instances"
	HeartbeatInterval    = 3 * time.Second
	HeartbeatTTL         = 10 * time.Second
)

// monitoring merges health and monitoring controllers and manages cluster instance heartbeats.
type App struct {
	DB         *pgxpool.Pool
	Cache      *cache.Cache
	Cfg        *config.Config
	Storage    *minio.Storage
	InstanceID string
}

func New(db *pgxpool.Pool, cch *cache.Cache, cfg *config.Config, storage *minio.Storage) *App {
	hostname, _ := os.Hostname()
	if hostname == "" {
		hostname = "node"
	}
	instanceID := fmt.Sprintf("%s-%s", hostname, uuid.New().String()[:8])
	return &App{
		DB:         db,
		Cache:      cch,
		Cfg:        cfg,
		Storage:    storage,
		InstanceID: instanceID,
	}
}

// StartHeartbeat starts periodic heartbeat reporting in Redis to register this instance.
func (a *App) StartHeartbeat(ctx context.Context) {
	if a.Cache == nil || a.Cache.Client() == nil {
		return
	}

	rdb := a.Cache.Client()
	now := time.Now().Unix()
	_ = rdb.ZAdd(ctx, InstanceHeartbeatKey, redis.Z{Score: float64(now), Member: a.InstanceID}).Err()

	go func() {
		ticker := time.NewTicker(HeartbeatInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 2*time.Second)
				_ = rdb.ZRem(cleanupCtx, InstanceHeartbeatKey, a.InstanceID).Err()
				cleanupCancel()
				return
			case <-ticker.C:
				current := time.Now().Unix()
				_ = rdb.ZAdd(ctx, InstanceHeartbeatKey, redis.Z{Score: float64(current), Member: a.InstanceID}).Err()
				_ = rdb.ZRemRangeByScore(ctx, InstanceHeartbeatKey, "-inf", fmt.Sprintf("%d", current-int64(HeartbeatTTL.Seconds()))).Err()
			}
		}
	}()
}

// GetActiveInstances returns the count of running backend instances registered in Redis.
func (a *App) GetActiveInstances(ctx context.Context) int {
	if a.Cache == nil || a.Cache.Client() == nil {
		return 1
	}

	rdb := a.Cache.Client()
	now := time.Now().Unix()
	minValidScore := now - int64(HeartbeatTTL.Seconds())

	_ = rdb.ZRemRangeByScore(ctx, InstanceHeartbeatKey, "-inf", fmt.Sprintf("%d", minValidScore)).Err()

	count, err := rdb.ZCount(ctx, InstanceHeartbeatKey, fmt.Sprintf("%d", minValidScore), "+inf").Result()
	if err != nil || count <= 0 {
		return 1
	}

	return int(count)
}
