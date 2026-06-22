package certificates

import (
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func (c *CertificateModule) ClaimController(ctx *fiber.Ctx) error {
	cert, err := c.ClaimService(utils.GetUserID(ctx), ctx.Params("courseID"))
	if err != nil {
		if err.Error() == "course not completed" {
			return utils.JSON(ctx, http.StatusForbidden, false, "course not completed", nil, nil)
		}
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to claim certificate", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusCreated, true, "certificate claimed", cert, nil)
}

func (c *CertificateModule) ListController(ctx *fiber.Ctx) error {
	list, err := c.ListService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch certificates", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "certificates fetched", list, nil)
}
