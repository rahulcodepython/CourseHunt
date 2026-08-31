package transactions

import (
	"coursehunt/server/internals/config"
	"coursehunt/server/internals/features/coupons"
	"coursehunt/server/internals/features/enrollments"
	"coursehunt/server/internals/pkg/razorpay"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB          *pgxpool.Pool
	Cfg         *config.Config
	Rzp         *razorpay.Client
	Enrollments *enrollments.App
	Coupons     *coupons.App
}

func New(db *pgxpool.Pool, cfg *config.Config, rzp *razorpay.Client, enrollmentsApp *enrollments.App, couponsApp *coupons.App) *App {
	return &App{
		DB:          db,
		Cfg:         cfg,
		Rzp:         rzp,
		Enrollments: enrollmentsApp,
		Coupons:     couponsApp,
	}
}
