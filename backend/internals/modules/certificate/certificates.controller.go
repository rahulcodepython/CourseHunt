package certificate

import (
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
	if !c.Enrollments.IsEnrolledRepository(userID, ctx.Params("courseID")) {
		return utils.JSON(ctx, http.StatusForbidden, false, "access denied: not enrolled in course", nil, nil)
	}
	cert, err := c.ClaimService(userID, ctx.Params("courseID"))
	if err != nil {
		if err.Error() == "course not completed" {
			return utils.JSON(ctx, http.StatusForbidden, false, "course not completed", nil, nil)
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
// @Success 200 {object} utils.SwaggerResponse[[]CertificateResponse]
// @Router /api/v1/certificates [get]
func (c *CertificateModule) ListController(ctx *fiber.Ctx) error {
	list, err := c.ListService(utils.GetUserID(ctx))
	if err != nil {
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch certificates", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "certificates fetched", list, nil)
}

// @Summary GetController
// @Description GetController for Certificate
// @Tags Certificate
// @Accept json
// @Produce json
// @Param courseID path string true "courseID"
// @Success 200 {object} utils.SwaggerResponse[Certificate]
// @Router /api/v1/certificates/course/{courseID} [get]
func (c *CertificateModule) GetController(ctx *fiber.Ctx) error {
	cert, err := c.GetService(utils.GetUserID(ctx), ctx.Params("courseID"))
	if err != nil {
		if err.Error() == "certificate not found" {
			return utils.JSON(ctx, http.StatusNotFound, false, "certificate not found", nil, nil)
		}
		return utils.JSON(ctx, http.StatusInternalServerError, false, "failed to fetch certificate", nil, err.Error())
	}
	return utils.JSON(ctx, http.StatusOK, true, "certificate fetched", cert, nil)
}
