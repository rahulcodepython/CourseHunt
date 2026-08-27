package utils

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// maxPage bounds the page number so `(page-1) * limit` (computed downstream
// by every repository's offset calculation) can never overflow int on a
// 64-bit build even at the max limit (100) — comfortably beyond any real
// pagination depth.
const maxPage = 1_000_000_000

func PaginationParams(c *fiber.Ctx) (int, int) {
	// strconv.Atoi returns (math.MaxInt, err) — not 0 — on overflow (e.g. a
	// page value with more digits than fits an int), so the error MUST be
	// checked here: silently discarding it let an oversized page value slip
	// through the `page < 1` guard below unclamped, and `(page-1) * limit`
	// would then wrap around into a negative offset a few lines downstream,
	// turning one crafted query string into a 500 on every paginated route.
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	if page > maxPage {
		page = maxPage
	}
	limit, err := strconv.Atoi(c.Query("limit", "20"))
	if err != nil || limit < 1 {
		limit = 1
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}
