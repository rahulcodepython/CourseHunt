package certificate

import (
	"errors"
	"net/http"

	"coursehunt-backend/internals/utils"

	"github.com/gofiber/fiber/v2"
)

// @Summary ClaimController
// @Description ClaimController for Certificate
// @Tags Certificate
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Success 200 {object} utils.SwaggerResponse[Certificate]
// @Router /api/v1/certificates/claim/course/{courseID} [post]
func (c *CertificateModule) ClaimController(ctx *fiber.Ctx) error {
	userID := utils.GetUserID(ctx)
	courseID := ctx.Params("courseID")

	cert, err := c.IssueRepository(userID, courseID)
	if err != nil {
		if errors.Is(err, ErrNotEnrolled) {
			return utils.JSON(ctx, http.StatusForbidden, false, err.Error(), nil, nil)
		}
		if errors.Is(err, ErrNotCompleted) {
			return utils.JSON(ctx, http.StatusForbidden, false, err.Error(), nil, nil)
		}
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to claim certificate", nil, err.Error())
	}

	return utils.JSON(ctx, http.StatusCreated, true, "certificate claimed", cert, nil)
}

// @Summary ListController
// @Description ListController for Certificate
// @Tags Certificate
// @Accept json
// @Produce json
// @Success 200 {object} utils.SwaggerResponse[[]Certificate]
// @Router /api/v1/certificates [get]
func (c *CertificateModule) ListController(ctx *fiber.Ctx) error {
	list, err := c.ListRepository(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch certificates", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "certificates fetched", list, nil)
}
