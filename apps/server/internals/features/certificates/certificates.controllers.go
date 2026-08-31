package certificates

import (
	"coursehunt/server/internals/generic"
	"coursehunt/server/internals/middlewares"
	"coursehunt/server/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (a *App) handleClaim(c *fiber.Ctx) error {
	cert, err := a.Claim(c.Context(), middlewares.UserID(c), c.Params("courseID"))
	if err != nil {
		return err
	}
	return utils.Created(c, "Certificate claimed.", cert)
}

func (a *App) handleList(c *fiber.Ctx) error {
	page, limit := utils.PaginationParams(c)
	list, total, err := a.List(c.Context(), middlewares.UserID(c), page, limit)
	if err != nil {
		return err
	}
	return utils.OK(c, "Certificates fetched.", generic.PaginatedResponse[[]Certificate]{
		Data: list, Total: total, Page: page, Limit: limit,
	})
}

// handleVerify is public and unauthenticated — reached by scanning a
// certificate's QR code. Always 200s; legitimacy is carried in the `valid`
// field of the response body, not the HTTP status.
func (a *App) handleVerify(c *fiber.Ctx) error {
	verification, err := a.Verify(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}
	return utils.OK(c, "Certificate verification checked.", verification)
}
